async function* getGeneratorHTMLULList(generator: AsyncGenerator<string, void, unknown>) {
  let buffer = ""
  let content = ""
  let inLiTag = false
  let collectingContent = false

  for await (const chunk of generator) {
    buffer += chunk

    while (buffer.length > 0) {
      // 检测是否遇到开始标签
      if (!inLiTag && buffer.includes("<li>")) {
        const startIndex = buffer.indexOf("<li>")
        inLiTag = true
        collectingContent = true
        buffer = buffer.substring(startIndex + 4) // 移除<li>标签
        continue
      }

      // 检测是否遇到结束标签
      if (inLiTag && buffer.includes("</li>")) {
        const endIndex = buffer.indexOf("</li>")

        // 提取内容并重置状态
        if (collectingContent) {
          content += buffer.substring(0, endIndex)
          yield content // 只返回li内的内容
          content = ""
        }

        inLiTag = false
        collectingContent = false
        buffer = buffer.substring(endIndex + 5) // 移除</li>标签
        continue
      }

      // 如果正在收集内容，添加到content
      if (collectingContent) {
        if (buffer.length > 1000) {
          content += buffer.substring(0, 500)
          buffer = buffer.substring(500)
        } else {
          // 否则，等待更多chunk
          break
        }
      } else {
        // 如果不在li标签内，丢弃buffer内容直到下一个<
        const nextTagIndex = buffer.indexOf("<")
        if (nextTagIndex !== -1) {
          buffer = buffer.substring(nextTagIndex)
        } else {
          buffer = ""
        }
        break
      }
    }
  }
}

export default getGeneratorHTMLULList
