#!/usr/bin/env python3
import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_KEYS_PATH = os.path.join(".data", "auth-public-keys.json")


def load_db(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {"keys": []}
        keys = data.get("keys")
        if not isinstance(keys, list):
            return {"keys": []}
        return {"keys": keys}
    except FileNotFoundError:
        return {"keys": []}


def save_db(path: str, data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = f"{path}.tmp.{os.getpid()}.{int(time.time() * 1000)}"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=True, indent=2)
    os.replace(tmp, path)


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def generate_with_cryptography() -> Optional[Tuple[str, str]]:
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ed25519
    except Exception:
        return None

    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    return private_pem.decode("ascii"), public_pem.decode("ascii")


def generate_with_openssl() -> Optional[Tuple[str, str]]:
    try:
        subprocess.run(["openssl", "version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        return None

    with tempfile.TemporaryDirectory() as tmpdir:
        priv_path = os.path.join(tmpdir, "ed25519.pem")
        pub_path = os.path.join(tmpdir, "ed25519.pub.pem")

        subprocess.run(["openssl", "genpkey", "-algorithm", "ed25519", "-out", priv_path], check=True)
        subprocess.run(["openssl", "pkey", "-in", priv_path, "-pubout", "-out", pub_path], check=True)

        with open(priv_path, "r", encoding="utf-8") as f:
            private_pem = f.read()
        with open(pub_path, "r", encoding="utf-8") as f:
            public_pem = f.read()

    return private_pem, public_pem


def generate_keypair() -> Tuple[str, str]:
    for generator in (generate_with_cryptography, generate_with_openssl):
        result = generator()
        if result:
            return result
    raise RuntimeError("No key generator available. Install 'cryptography' or ensure openssl is available.")


def print_private_key(private_pem: str, out_path: Optional[str]) -> None:
    if out_path:
        os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(private_pem)
        os.chmod(out_path, 0o600)
    else:
        sys.stdout.write(private_pem)
        if not private_pem.endswith("\n"):
            sys.stdout.write("\n")


def normalize_key(pem: str) -> str:
    return pem.strip()


def add_key(db: Dict[str, Any], key_id: str, public_key: str, label: Optional[str]) -> None:
    record = {
        "id": key_id,
        "publicKey": normalize_key(public_key),
        "label": label or None,
        "createdAt": int(time.time() * 1000),
    }
    db["keys"].append(record)


def list_keys(db: Dict[str, Any]) -> None:
    keys = db.get("keys", [])
    if not keys:
        print("No keys found.")
        return
    for key in keys:
        print(f"{key.get('id')}  {key.get('label') or ''}".rstrip())


def remove_key(db: Dict[str, Any], key_id: str) -> bool:
    keys = db.get("keys", [])
    before = len(keys)
    db["keys"] = [k for k in keys if k.get("id") != key_id]
    return len(db["keys"]) != before


def show_key(db: Dict[str, Any], key_id: str) -> None:
    keys = db.get("keys", [])
    for key in keys:
        if key.get("id") == key_id:
            print(key.get("publicKey", ""))
            return
    raise SystemExit(f"Key id not found: {key_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage ReadBridge auth keys (server-side only).")
    parser.add_argument(
        "--db",
        default=os.environ.get("READ_BRIDGE_AUTH_KEYS_PATH", DEFAULT_KEYS_PATH),
        help="Path to auth-public-keys.json",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    gen = sub.add_parser("generate", help="Generate a new Ed25519 keypair and store the public key.")
    gen.add_argument("--label", help="Optional label to attach to the key")
    gen.add_argument("--id", dest="key_id", help="Optional key id (defaults to UUID)")
    gen.add_argument("--out-private", help="Write private key PEM to this path (stdout if omitted)")

    sub.add_parser("list", help="List key ids")

    revoke = sub.add_parser("revoke", help="Remove a key by id")
    revoke.add_argument("key_id")

    show = sub.add_parser("show", help="Print a public key by id")
    show.add_argument("key_id")

    args = parser.parse_args()

    db = load_db(args.db)

    if args.command == "generate":
        key_id = args.key_id or str(uuid.uuid4())
        private_pem, public_pem = generate_keypair()
        add_key(db, key_id, public_pem, args.label)
        save_db(args.db, db)
        print(f"Key created: {key_id}")
        print_private_key(private_pem, args.out_private)
        return

    if args.command == "list":
        list_keys(db)
        return

    if args.command == "revoke":
        removed = remove_key(db, args.key_id)
        if not removed:
            raise SystemExit(f"Key id not found: {args.key_id}")
        save_db(args.db, db)
        print(f"Revoked: {args.key_id}")
        return

    if args.command == "show":
        show_key(db, args.key_id)
        return


if __name__ == "__main__":
    main()
