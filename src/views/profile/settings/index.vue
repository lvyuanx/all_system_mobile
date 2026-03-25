<script setup>
import { ref } from 'vue'

const settings = ref({
  notifications: true,
  language: 'zh-CN',
  fontSize: 'medium',
})

const languageOptions = [
  { text: '简体中文', value: 'zh-CN' },
  { text: 'English', value: 'en-US' },
]

const fontSizeOptions = [
  { text: '小', value: 'small' },
  { text: '中', value: 'medium' },
  { text: '大', value: 'large' },
]

const showLanguagePicker = ref(false)
const showFontSizePicker = ref(false)

const onLanguageConfirm = ({ selectedOptions }) => {
  settings.value.language = selectedOptions[0].value
  showLanguagePicker.value = false
  vant.showToast(`已切换语言：${selectedOptions[0].text}`)
}

const onFontSizeConfirm = ({ selectedOptions }) => {
  settings.value.fontSize = selectedOptions[0].value
  showFontSizePicker.value = false
  vant.showToast(`已设置字体大小：${selectedOptions[0].text}`)
}

const onNotificationChange = (checked) => {
  settings.value.notifications = checked
  vant.showToast(checked ? '已开启消息通知' : '已关闭消息通知')
}

const onClearCache = () => {
  vant.showConfirmDialog({
    title: '确认清除',
    message: '确定要清除所有缓存吗？',
  })
    .then(() => {
      vant.showToast('缓存已清除')
    })
    .catch(() => {})
}

const onAbout = () => {
  vant.showDialog({
    title: '关于应用',
    message: 'Vue3 + Vant4 移动端示例项目\n版本：1.0.0',
  })
}
</script>

<template>
  <div class="settings-page">
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

    <van-cell-group inset title="其他" class="section">
      <van-cell title="清除缓存" is-link @click="onClearCache" />
      <van-cell title="关于应用" is-link @click="onAbout" />
    </van-cell-group>

    <van-popup v-model:show="showLanguagePicker" round position="bottom">
      <van-picker
        :columns="languageOptions"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>

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
