/**
 * CloudBase 云函数示例
 * 入口: exports.main
 * 调用: cloudbase.callFunction({ name: 'hello', data: { name: 'World' } })
 */
exports.main = async (event, context) => {
  const name = event.name || "CloudBase";
  return {
    code: 0,
    message: "success",
    data: {
      greeting: `Hello, ${name}!`,
      timestamp: Date.now(),
    },
  };
};
