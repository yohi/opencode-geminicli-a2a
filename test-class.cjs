class TestClass {
  constructor() { this.a = 1; }
}
const plugin = { provider: TestClass };

// OpenCodeの初期化をシミュレート
try {
  const p = plugin.provider();
} catch (e) {
  console.error(e.message);
}
