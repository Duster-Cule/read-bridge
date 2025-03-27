import { Tooltip } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
export default function ToolTipLabel(label: string, text: string) {
  return (
    <div className='flex items-center gap-1'>
      <span className=''>{label}</span>
      <Tooltip title={text}>
        <InfoCircleOutlined className='text-gray-500' />
      </Tooltip>
    </div>
  )
}