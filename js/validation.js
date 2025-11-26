// 이메일 형식: 아주 기본적인 형태만 체크
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 규칙: 8~20자, 대문자/소문자/숫자/특수문자 각각 1개 이상
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|;:'",.<>/?`~]).{8,20}$/;

// 공통으로 사용할 안내 문구 (앞에 *은 화면마다 붙이고 싶을 수 있어서 빼둠)
export const PASSWORD_RULE_MESSAGE =
  "비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";

export function isValidEmail(value) {
  if (!value) return false;
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value) {
  if (!value) return false;
  return PASSWORD_REGEX.test(value.trim());
}
