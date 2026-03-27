import { onShow } from "@dcloudio/uni-app";
import { watch } from "vue";
import { useI18n } from "vue-i18n";

/** 同步导航栏标题，并在切换界面语言时更新 */
export function useNavTitle(messageKey: string) {
  const { t, locale } = useI18n();
  const apply = () => {
    uni.setNavigationBarTitle({ title: t(messageKey) });
  };
  onShow(apply);
  watch(locale, apply);
}
