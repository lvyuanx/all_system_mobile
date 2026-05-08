<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  closeToast,
  showConfirmDialog,
  showLoadingToast,
  showToast,
} from 'vant'
import { addPattern } from '@/api/pattern'
import { goBackWithTransition } from '@/utils/navigationTransition'

const router = useRouter()

const submitting = ref(false)

const form = ref({
  code: '',
  memo: '',
  tags: [],
  is_active: true,
  mainImageFile: null,
  imageFiles: [],
})

const mainImageFileList = ref([])
const subImageFileList = ref([])

const showTagDialog = ref(false)
const dialogTagValue = ref('')

const tagCount = computed(() => form.value.tags.length)
const subImageCount = computed(() => subImageFileList.value.length)
const hasMainImage = computed(() => mainImageFileList.value.length > 0)

const mainImageHint = computed(() => {
  if (hasMainImage.value) return '已选择主图，可继续替换'
  return '建议上传一张清晰主图作为封面'
})

const mainImageBadge = computed(() => {
  if (hasMainImage.value) return '已选 1 张'
  return '推荐 1 张'
})

const returnToLibrary = () => {
  goBackWithTransition(router, '/home/pattern-library')
}

const onMainImageRead = ({ file }) => {
  form.value.mainImageFile = file
}

const onMainImageDelete = () => {
  form.value.mainImageFile = null
}

const syncSubImages = () => {
  form.value.imageFiles = subImageFileList.value.filter((f) => f.file).map((f) => f.file)
}

const onSubImageRead = () => {
  syncSubImages()
}

const onSubImageDelete = (_, { index }) => {
  subImageFileList.value.splice(index, 1)
  syncSubImages()
}

const openTagDialog = () => {
  dialogTagValue.value = ''
  showTagDialog.value = true
}

const confirmTagDialog = () => {
  const val = dialogTagValue.value.trim()
  if (val && !form.value.tags.includes(val)) {
    form.value.tags.push(val)
  }
  dialogTagValue.value = ''
  showTagDialog.value = false
}

const removeTag = (tag) => {
  const idx = form.value.tags.indexOf(tag)
  if (idx > -1) form.value.tags.splice(idx, 1)
}

const onSubmit = async () => {
  if (submitting.value) return

  const code = form.value.code.trim()
  if (!code) {
    showToast('请输入版式编号')
    return
  }

  submitting.value = true
  showLoadingToast({ message: '提交中...', forbidClick: true, duration: 0 })

  try {
    const fd = new FormData()
    fd.append('code', code)
    fd.append('memo', form.value.memo)
    fd.append('is_active', form.value.is_active)

    form.value.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => fd.append('tags', tag))

    if (form.value.mainImageFile) {
      fd.append('main_image', form.value.mainImageFile)
    }

    form.value.imageFiles.forEach((file) => fd.append('images', file))

    await addPattern(fd, { loading: false })
    closeToast()
    showToast('新增成功')
    returnToLibrary()
  } catch {
    closeToast()
  } finally {
    submitting.value = false
  }
}

const onCancel = async () => {
  try {
    await showConfirmDialog({ title: '提示', message: '放弃新增这张版式吗？' })
    returnToLibrary()
  } catch {
    // 取消
  }
}
</script>

<template>
  <div class="page">
    <div class="bg bg-one" />
    <div class="bg bg-two" />

    <header class="hero">
      <div class="hero-top">
        <button class="hero-back" type="button" @click="onCancel">
          <van-icon name="arrow-left" size="18" />
        </button>
        <span class="hero-badge">NEW</span>
      </div>

      <div class="hero-copy">
        <div class="eyebrow">Pattern Library</div>
        <h1>新增版式</h1>
        <p>整理编号、标签和图片，快速建立一个可检索的版式档案。</p>
      </div>

      <div class="hero-meta">
        <div class="meta-chip">
          <span class="meta-value">{{ tagCount }}</span>
          <span class="meta-label">标签</span>
        </div>
        <div class="meta-chip">
          <span class="meta-value">{{ subImageCount }}</span>
          <span class="meta-label">辅图</span>
        </div>
        <div class="meta-chip meta-chip--status" :class="{ active: form.is_active }">
          {{ form.is_active ? '上架中' : '已停用' }}
        </div>
      </div>
    </header>

    <main class="content">
      <section class="surface surface--accent">
        <div class="section-head">
          <div>
            <div class="section-kicker">BASIC INFO</div>
            <div class="section-title">基础信息</div>
          </div>
          <van-switch v-model="form.is_active" size="24" active-color="#2563eb" />
        </div>

        <div class="field-stack">
          <div class="field-card">
            <div class="field-head">
              <span>版式编号</span>
              <span class="field-tip field-tip--required">必填</span>
            </div>
            <van-field
              v-model="form.code"
              class="plain-field"
              placeholder="请输入版式编号"
              maxlength="32"
              clearable
            />
          </div>

          <div class="field-card">
            <div class="field-head">
              <span>备注</span>
              <span class="field-tip">可选</span>
            </div>
            <van-field
              v-model="form.memo"
              class="plain-field plain-field--textarea"
              type="textarea"
              rows="3"
              autosize
              maxlength="200"
              show-word-limit
              placeholder="填写版式特点、适用场景或补充说明"
            />
          </div>
        </div>
      </section>

      <section class="surface">
        <div class="section-head">
          <div>
            <div class="section-kicker">TAGS</div>
            <div class="section-title">标签管理</div>
          </div>
          <button type="button" class="ghost-action" @click="openTagDialog">
            添加标签
          </button>
        </div>
        <p class="section-desc">用标签快速标记风格、材质、季节等关键信息。</p>

        <div v-if="form.tags.length" class="tag-list">
          <button
            v-for="tag in form.tags"
            :key="tag"
            type="button"
            class="tag-chip"
            @click="removeTag(tag)"
          >
            <span>{{ tag }}</span>
            <van-icon name="cross" size="12" />
          </button>
        </div>
        <div v-else class="empty-tip">
          还没有标签，先添加几个关键词吧。
        </div>
      </section>

      <section class="surface">
        <div class="section-head">
          <div>
            <div class="section-kicker">IMAGES</div>
            <div class="section-title">图片素材</div>
          </div>
          <span class="section-desc-inline">{{ mainImageBadge }}</span>
        </div>

        <div class="upload-main">
          <van-uploader
            v-model="mainImageFileList"
            class="main-uploader"
            :max-count="1"
            accept="image/*"
            preview-size="116px"
            :after-read="onMainImageRead"
            @delete="onMainImageDelete"
          />
          <div class="upload-copy">
            <div class="upload-title">主图</div>
            <div class="upload-text">{{ mainImageHint }}</div>
            <div class="upload-note">建议方图，能更好展示版式主体</div>
          </div>
        </div>

        <div class="sub-upload-head">
          <span>辅图</span>
          <span>{{ subImageCount }} 张</span>
        </div>
        <div class="sub-upload-wrap">
          <van-uploader
            v-model="subImageFileList"
            class="sub-uploader"
            multiple
            accept="image/*"
            preview-size="84px"
            :after-read="onSubImageRead"
            @delete="onSubImageDelete"
          />
        </div>
      </section>
    </main>

    <footer class="bottom-bar">
      <button type="button" class="bottom-btn bottom-btn--ghost" @click="onCancel">
        取消
      </button>
      <button type="button" class="bottom-btn bottom-btn--primary" :disabled="submitting" @click="onSubmit">
        {{ submitting ? '提交中...' : '提交版式' }}
      </button>
    </footer>

    <van-dialog
      v-model:show="showTagDialog"
      title="添加标签"
      show-cancel-button
      @confirm="confirmTagDialog"
    >
      <div class="tag-dialog-body">
        <van-field
          v-model="dialogTagValue"
          placeholder="请输入标签"
          maxlength="20"
          clearable
        />
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background:
    radial-gradient(circle at top left, rgba(91, 110, 245, 0.14), transparent 34%),
    radial-gradient(circle at 90% 12%, rgba(139, 92, 246, 0.12), transparent 26%),
    linear-gradient(180deg, #f4f6fb 0%, #f7f8fc 100%);
  padding: calc(14px + env(safe-area-inset-top)) 14px calc(104px + env(safe-area-inset-bottom));
}

.bg {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(6px);
  opacity: 0.65;
}

.bg-one {
  top: -36px;
  right: -26px;
  width: 110px;
  height: 110px;
  background: rgba(91, 110, 245, 0.18);
}

.bg-two {
  top: 110px;
  left: -24px;
  width: 84px;
  height: 84px;
  background: rgba(139, 92, 246, 0.14);
}

.hero,
.surface {
  position: relative;
  z-index: 1;
}

.hero {
  border-radius: 24px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.92) 0%, rgba(37, 99, 235, 0.96) 100%);
  color: #fff;
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.22);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-back {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hero-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.78);
}

.hero-copy {
  padding-top: 18px;
}

.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.64);
}

.hero-copy h1 {
  margin: 8px 0 0;
  font-size: 26px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.hero-copy p {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.78);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.meta-chip {
  min-width: 76px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.meta-chip--status {
  min-width: auto;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  padding-inline: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.meta-chip--status.active {
  background: rgba(34, 197, 94, 0.16);
  color: #dcfce7;
}

.meta-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.meta-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.68);
}

.content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.surface {
  border-radius: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(20px);
}

.surface--accent {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.92));
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #94a3b8;
}

.section-title {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.section-desc {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.section-desc-inline {
  font-size: 12px;
  color: #64748b;
  padding-top: 2px;
}

.ghost-action {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--color-primary) 10%, #ffffff);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.field-stack {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.field-card {
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 12px 12px 10px;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.field-tip {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.field-tip--required {
  color: #2563eb;
}

.plain-field {
  padding: 0;
  background: transparent;
}

.plain-field :deep(.van-field__body) {
  align-items: flex-start;
}

.plain-field :deep(.van-field__control) {
  font-size: 14px;
  line-height: 1.7;
  color: #0f172a;
}

.plain-field--textarea :deep(textarea) {
  min-height: 76px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-chip {
  border: 1px solid rgba(37, 99, 235, 0.12);
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.empty-tip {
  margin-top: 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  color: #94a3b8;
  padding: 14px 12px;
  font-size: 12px;
}

.upload-main {
  display: grid;
  grid-template-columns: 116px 1fr;
  gap: 12px;
  margin-top: 14px;
  align-items: center;
}

.main-uploader {
  justify-self: start;
}

.main-uploader :deep(.van-uploader__wrapper) {
  width: 116px;
  min-height: 116px;
}

.main-uploader :deep(.van-uploader__upload),
.main-uploader :deep(.van-uploader__preview) {
  width: 116px !important;
  height: 116px !important;
  border-radius: 18px;
  overflow: hidden;
}

.main-uploader :deep(.van-uploader__upload) {
  border: 1px dashed #cbd5e1;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.main-uploader :deep(.van-uploader__upload-icon) {
  color: #94a3b8;
}

.upload-copy {
  min-width: 0;
}

.upload-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.upload-text {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.upload-note {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
}

.sub-upload-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.sub-upload-head span:last-child {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.sub-upload-wrap {
  margin-top: 10px;
}

.sub-uploader :deep(.van-uploader__wrapper) {
  gap: 10px;
}

.sub-uploader :deep(.van-uploader__upload),
.sub-uploader :deep(.van-uploader__preview) {
  width: 84px !important;
  height: 84px !important;
  border-radius: 16px;
  overflow: hidden;
}

.sub-uploader :deep(.van-uploader__upload) {
  border: 1px dashed #cbd5e1;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 10px;
  padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(244, 246, 251, 0), rgba(244, 246, 251, 0.92) 24%, #f4f6fb 62%);
  backdrop-filter: blur(14px);
  pointer-events: none;
}

.bottom-btn {
  border: 0;
  height: 48px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 700;
  pointer-events: auto;
}

.bottom-btn--ghost {
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.bottom-btn--primary {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  box-shadow: 0 14px 24px rgba(37, 99, 235, 0.24);
}

.bottom-btn:disabled {
  opacity: 0.72;
}

.tag-dialog-body {
  padding: 8px 16px 4px;
}

@media (max-width: 360px) {
  .page {
    padding-inline: 10px;
  }

  .upload-main {
    grid-template-columns: 1fr;
  }
}
</style>
