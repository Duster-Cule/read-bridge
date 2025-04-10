import React from "react";

type IconSvgProps = React.SVGProps<SVGSVGElement> & {
  size?: number
}
interface IconProps {
  className?: string
}

export const LogoIcon: React.FC<IconProps & IconSvgProps> = ({
  size = 24,
  className,
  color = '#54808C',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    viewBox="0 -960 960 960"
    fill={color}
    className={className}
    {...props}
  >
    <path d="M480-160q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740v484q51-32 107-48t113-16q36 0 70.5 6t69.5 18v-480q15 5 29.5 10.5T898-752q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm80-200v-380l200-200v400L560-360Zm-160 65v-396q-33-14-68.5-21.5T260-720q-37 0-72 7t-68 21v397q35-13 69.5-19t70.5-6q36 0 70.5 6t69.5 19Zm0 0v-396 396Z" />
  </svg>
);

export const StarIcon: React.FC<IconProps & IconSvgProps> = ({
  size = 24,
  className,
  color = '#54808C',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    viewBox="0 -960 960 960"
    fill={color}
    className={className}
    {...props}
  >
    <path d="m509-472 71-43 71 43q6 4 11.5 0t3.5-11l-19-81 62-54q5-5 3.5-10.5T704-635l-82-7-33-76q-2-6-9-6t-9 6l-33 76-82 7q-7 1-8.5 6.5T451-618l62 54-19 81q-2 7 3.5 11t11.5 0ZM360-280q-33 0-56.5-23.5T280-360v-440q0-33 23.5-56.5T360-880h440q33 0 56.5 23.5T880-800v440q0 33-23.5 56.5T800-280H360Zm0-80h440v-440H360v440Zm220-220ZM218-164Zm10 79q-33 4-59.5-16T138-154L85-591q-4-33 17-59t54-31h2q17-3 30.5 9t13.5 30q0 15-10.5 26T166-602h-1l54 438 474-58q17-2 30 8t15 27q2 17-8 29.5T703-143L228-85Z" />
  </svg>
);

export const CopyIcon: React.FC<IconProps & IconSvgProps> = ({
  size = 20,
  className,
  color = '#999',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className} {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
)
