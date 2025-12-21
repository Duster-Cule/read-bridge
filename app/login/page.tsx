"use client"

import { App, Button, Form, Input, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type LoginForm = {
  keyId: string
  privateKey: string
}

const STORAGE_KEY_ID = 'rb_key_id'
const STORAGE_PRIVATE_KEY = 'rb_private_key'

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function importPrivateKey(pem: string): Promise<{
  key: CryptoKey
  signAlgorithm: Algorithm | RsaPssParams | EcdsaParams
}> {
  const keyData = pemToArrayBuffer(pem)
  const candidates: Array<{
    importAlgorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams
    signAlgorithm: Algorithm | RsaPssParams | EcdsaParams
  }> = [
    {
      importAlgorithm: { name: 'Ed25519' },
      signAlgorithm: { name: 'Ed25519' },
    },
    {
      importAlgorithm: { name: 'ECDSA', namedCurve: 'P-256' },
      signAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
    },
    {
      importAlgorithm: { name: 'ECDSA', namedCurve: 'P-384' },
      signAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
    },
    {
      importAlgorithm: { name: 'ECDSA', namedCurve: 'P-521' },
      signAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
    },
    {
      importAlgorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      signAlgorithm: { name: 'RSASSA-PKCS1-v1_5' },
    },
  ]

  for (const candidate of candidates) {
    try {
      const key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        candidate.importAlgorithm,
        false,
        ['sign']
      )
      return { key, signAlgorithm: candidate.signAlgorithm }
    } catch {
      // try next
    }
  }

  throw new Error('Unsupported private key format')
}

async function signChallenge(privateKeyPem: string, challenge: string): Promise<string> {
  const { key, signAlgorithm } = await importPrivateKey(privateKeyPem)
  const data = new TextEncoder().encode(challenge)
  const signature = await crypto.subtle.sign(signAlgorithm, key, data)
  return bufferToBase64Url(signature)
}

export default function LoginPage() {
  const { message } = App.useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const nextPath = useMemo(() => searchParams.get('next') || '/', [searchParams])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const resp = await fetch('/api/auth/session', { cache: 'no-store' })
        if (resp.ok) {
          router.replace(nextPath)
        }
      } catch {
        // ignore
      }
    }
    void checkSession()
  }, [nextPath, router])

  const initialValues = useMemo<LoginForm>(() => {
    if (typeof window === 'undefined') return { keyId: '', privateKey: '' }
    return {
      keyId: localStorage.getItem(STORAGE_KEY_ID) || '',
      privateKey: localStorage.getItem(STORAGE_PRIVATE_KEY) || '',
    }
  }, [])

  const handleSubmit = async (values: LoginForm) => {
    const keyId = values.keyId.trim()
    const privateKey = values.privateKey.trim()

    if (!keyId || !privateKey) {
      message.error('Please provide key id and private key')
      return
    }

    setLoading(true)
    try {
      const challengeResp = await fetch('/api/auth/challenge', { cache: 'no-store' })
      if (!challengeResp.ok) {
        throw new Error('Failed to request challenge')
      }

      const challengeData = (await challengeResp.json()) as { challenge?: string }
      if (!challengeData.challenge) {
        throw new Error('Invalid challenge response')
      }

      const signature = await signChallenge(privateKey, challengeData.challenge)

      const loginResp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: challengeData.challenge,
          signature,
          keyId,
        }),
      })

      if (!loginResp.ok) {
        throw new Error('Login failed')
      }

      localStorage.setItem(STORAGE_KEY_ID, keyId)
      localStorage.setItem(STORAGE_PRIVATE_KEY, privateKey)
      router.replace(nextPath)
    } catch (err) {
      console.error(err)
      message.error('Login failed, please check the key and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[560px]">
        <Typography.Title level={2} className="text-center">
          ReadBridge Login
        </Typography.Title>
        <Typography.Paragraph className="text-center text-gray-500">
          Provide your key id and private key to access the app.
        </Typography.Paragraph>
        <Form<LoginForm> layout="vertical" initialValues={initialValues} onFinish={handleSubmit}>
          <Form.Item label="Key ID" name="keyId" rules={[{ required: true }]}>
            <Input placeholder="key id" autoComplete="off" />
          </Form.Item>
          <Form.Item label="Private Key (PEM)" name="privateKey" rules={[{ required: true }]}>
            <Input.TextArea rows={8} placeholder="-----BEGIN PRIVATE KEY-----" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign in
          </Button>
        </Form>
      </div>
    </div>
  )
}
