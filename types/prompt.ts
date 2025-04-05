import { OUTPUT_TYPE } from "@/constants/prompt"

export type OutputType = typeof OUTPUT_TYPE[keyof typeof OUTPUT_TYPE]
