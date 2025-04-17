async function* getGeneratorHTMLULList(generator: AsyncGenerator<string, void, unknown>) {
  let buffer = ""
  let content = ""
  let inLiTag = false
  let inPTag = false
  let collectingContent = false

  for await (const chunk of generator) {
    buffer += chunk
    while (buffer.length > 0) {
      // 处理p
      if (!inPTag && buffer.includes("<p>")) {
        const startIndex = buffer.indexOf("<p>")
        inPTag = true
        collectingContent = true
        buffer = buffer.substring(startIndex + 3)
        continue
      }
      if (inPTag && buffer.includes('</')) {
        const endIndex = buffer.indexOf('</')
        yield buffer.substring(0, endIndex)
        return
      }
      if (inPTag) {
        yield buffer
        buffer = ""
        continue
      }
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

async function* getGeneratorThinkAndHTMLTag(generator: AsyncGenerator<string, void, unknown>): AsyncGenerator<string, void, unknown> {
  // 获取第一个数据块
  const firstChunk = await generator.next()

  // 检查第一个数据块是否包含<think>标签
  if (firstChunk.done) {
    return; // 如果生成器已结束，直接返回
  }

  if (firstChunk.value?.includes("<think>")) {
    yield firstChunk.value

    // 继续获取直到</think>标签
    for await (const chunk of generator) {
      yield chunk
      if (chunk.includes("</think>")) {
        break
      }
    }

    // 处理剩余的HTML列表
    yield* getGeneratorHTMLULList((async function* () {
      yield* generator
    })())
  } else {
    // 如果不包含<think>标签，直接处理为HTML列表
    // 创建一个新的生成器，包含第一个数据块和原生成器的内容
    yield* getGeneratorHTMLULList((async function* () {
      if (firstChunk.value) {
        yield firstChunk.value
      }
      yield* generator
    })());
  }
}


export default getGeneratorThinkAndHTMLTag
