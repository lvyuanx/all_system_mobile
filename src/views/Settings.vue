<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 用户设置
const settings = ref({
  notifications: true,
  language: 'zh-CN',
  fontSize: 'medium',
})

// 语言选项
const languageOptions = [
  { text: '简体中文', value: 'zh-CN' },
  { text: 'English', value: 'en-US' },
]

// 字体大小选项
const fontSizeOptions = [
  { text: '小', value: 'small' },
  { text: '中', value: 'medium' },
  { text: '大', value: 'large' },
]

// 显示语言选择器
const showLanguagePicker = ref(false)

// 显示字体大小选择器
const showFontSizePicker = ref(false)

// 语言选择确认
const onLanguageConfirm = ({ selectedOptions }) => {
  settings.value.language = selectedOptions[0].value
  showLanguagePicker.value = false
  vant.showToast(`已切换语言：${selectedOptions[0].text}`)
}

// 字体大小选择确认
const onFontSizeConfirm = ({ selectedOptions }) => {
  settings.value.fontSize = selectedOptions[0].value
  showFontSizePicker.value = false
  vant.showToast(`已设置字体大小：${selectedOptions[0].text}`)
}

// 消息通知切换
const onNotificationChange = (checked) => {
  settings.value.notifications = checked
  vant.showToast(checked ? '已开启消息通知' : '已关闭消息通知')
}

// 清除缓存
const onClearCache = () => {
  vant.showConfirmDialog({
    title: '确认清除',
    message: '确定要清除所有缓存吗？',
  })
    .then(() => {
      vant.showToast('缓存已清除')
    })
    .catch(() => {
      // 取消
    })
}

// 关于应用
const onAbout = () => {
  vant.showDialog({
    title: '关于应用',
    message: 'Vue3 + Vant4 移动端示例项目\n版本：1.0.0',
  })
}

// 返回
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="settings-page">
    <!-- 通用设置 -->
    <van-cell-group inset title="通用设置" class="section">
      <van-cell
        title="语言"
        :value="settings.language === 'zh-CN' ? '简体中文' : 'English'"
        is-link
        @click="showLanguagePicker = true"
      />

      <van-cell
        title="字体大小"
        :value="settings.fontSize === 'small' ? '小' : settings.fontSize === 'medium' ? '中' : '大'"
        is-link
        @click="showFontSizePicker = true"
      />
    </van-cell-group>

    <!-- 通知设置 -->
    <van-cell-group inset title="通知设置" class="section">
      <van-cell center title="消息通知" is-link>
        <template #right-icon>
          <van-switch
            v-model="settings.notifications"
            size="20"
            @change="onNotificationChange"
          />
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 其他 -->
    <van-cell-group inset title="其他" class="section">
      <van-cell title="清除缓存" is-link @click="onClearCache" />
      <van-cell title="关于应用" is-link @click="onAbout" />
    </van-cell-group>

    <!-- 语言选择器 -->
    <van-popup v-model:show="showLanguagePicker" round position="bottom">
      <van-picker
        :columns="languageOptions"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>

    <!-- 字体大小选择器 -->
    <van-popup v-model:show="showFontSizePicker" round position="bottom">
      <van-picker
        :columns="fontSizeOptions"
        @confirm="onFontSizeConfirm"
        @cancel="showFontSizePicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100%;
  padding: 12px;
  background-color: var(--color-background);
}

.section {
  margin-bottom: 12px;
}
</style>
