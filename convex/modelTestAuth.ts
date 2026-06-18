export function requireModelTestAdminPassword(password: string) {
  const expected = process.env.MODEL_TEST_ADMIN_PASSWORD;

  if (!expected) {
    throw new Error("MODEL_TEST_ADMIN_PASSWORD is not configured.");
  }

  if (!constantTimeEqual(password, expected)) {
    throw new Error("Invalid model test password.");
  }
}

function constantTimeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    const leftCode = index < left.length ? left.charCodeAt(index) : 0;
    const rightCode = index < right.length ? right.charCodeAt(index) : 0;
    diff |= leftCode ^ rightCode;
  }

  return diff === 0;
}
