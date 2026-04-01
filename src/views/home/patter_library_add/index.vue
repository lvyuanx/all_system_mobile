<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import { addPattern } from '@/api/pattern'

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

const onMainImageRead = ({ file }) => {
  form.value.mainImageFile = file
}

const onMainImageDelete = () => {
  form.value.mainImageFile = null
}

const onSubImageRead = () => {
  syncSubImages()
}

const onSubImageDelete = (_, { index }) => {
  subImageFileList.value.splice(index, 1)
  syncSubImages()
}

const syncSubImages = () => {
  form.value.imageFiles = subImageFileList.value.filter((f) => f.file).map((f) => f.file)
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
    form.value.tags.map((t) => t.trim()).filter(Boolean)
      .forEach((t) => fd.append('tags', t))
    if (form.value.mainImageFile) {
      fd.append('main_image', form.value.mainImageFile)
    }
    form.value.imageFiles.forEach((f) => fd.append('images', f))
    await addPattern(fd, { loading: false })
    closeToast()
    showToast('新增成功')
    router.back()
  } catch {
    closeToast()
  } finally {
    submitting.value = false
  }
}

const onCancel = async () => {
  try {
    await showConfirmDialog({ title: '提示', message: '放弃新增？' })
    router.back()
  } catch {}
}
</script>

<template>
  <div class="page">
    <div class="info-card">
      <div class="info-header">
        <div class="code-text">新增板式</div>
        <div class="action-row">
          <button class="btn-cancel" @click="onCancel">取消</button>
          <button class="btn-save" :disabled="submitting" @click="onSubmit">
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>

      <van-cell-group class="edit-group">
        <van-field v-model="form.code" label="版式编号" placeholder="请输入版式编号" />
        <van-field v-model="form.memo" label="备注" placeholder="请输入备注" />
        <van-cell title="标签" center>
          <template #right-icon>
            <van-button size="small" type="primary" @click="openTagDialog">添加</van-button>
          </template>
        </van-cell>
        <div class="tag-edit-list" v-if="form.tags.length">
          <van-tag
            v-for="tag in form.tags"
            :key="tag"
            type="primary"
            closeable
            @close="removeTag(tag)"
          >
            {{ tag }}
          </van-tag>
        </div>
        <van-cell title="上架状态" center>
          <template #right-icon>
            <van-switch v-model="form.is_active" size="22" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="section">
      <div class="section-title">主图</div>
      <van-uploader
        v-model="mainImageFileList"
        :max-count="1"
        accept="image/*"
        :after-read="onMainImageRead"
        @delete="onMainImageDelete"
      />
    </div>
    <div class="section">
      <div class="section-title">辅图</div>
      <van-uploader
        v-model="subImageFileList"
        multiple
        accept="image/*"
        :after-read="onSubImageRead"
        @delete="onSubImageDelete"
      />
    </div>

    <van-dialog
      v-model:show="showTagDialog"
      title="添加标签"
      show-cancel-button
      @confirm="confirmTagDialog"
    >
      <div class="tag-dialog-body">
        <van-field v-model="dialogTagValue" placeholder="请输入标签" />
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f2f3f7;
  padding-bottom: 40px;
}

.info-card {
  margin: 14px;
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.code-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.5px;
}

.action-row {
  display: flex;
  gap: 8px;
}

.btn-cancel, .btn-save {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #888;
}

.btn-save {
  background: linear-gradient(90deg, #5b6ef5, #8b5cf6);
  color: #fff;
}

.btn-save:disabled {
  opacity: 0.6;
}

.edit-group {
  margin: 0 -16px;
}

.tag-edit-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  margin: 6px 0 2px;
  background: #f7f8ff;
  border: 1px solid rgba(91, 110, 245, 0.12);
  border-radius: 12px;
}

.tag-edit-list :deep(.van-tag) {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 999px;
}

.section {
  margin: 16px 14px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

.tag-dialog-body {
  padding: 8px 16px 4px;
}
</style>
