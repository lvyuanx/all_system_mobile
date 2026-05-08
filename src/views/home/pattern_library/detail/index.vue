<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  showToast,
  showLoadingToast,
  closeToast,
  showConfirmDialog,
  showImagePreview,
} from 'vant'
import {
  activatePattern,
  deactivatePattern,
  getPatternInfo,
  getPatternList,
  updatePattern,
} from '@/api/pattern'
import { goBackWithTransition } from '@/utils/navigationTransition'

const route = useRoute()
const router = useRouter()

const patternCode = route.query.code
let patternId = Number(route.query.pattern_id) || null

const editing = ref(false)
const submitting = ref(false)
const detail = ref(null)

const form = ref({
  memo: '',
  tags: [],
  is_active: true,
  mainImageId: null,
  mainImageFile: null,
  imageIds: [],
  newImageFiles: [],
})

const showTagDialog = ref(false)
const dialogTagValue = ref('')

const mainImageFileList = ref([])
const subImageFileList = ref([])

const resolvePatternId = async () => {
  if (patternId) return
  const res = await getPatternList(
    { page: 1, page_size: 1, filter: JSON.stringify({ search: patternCode }) },
    { loading: false },
  )
  const item = res?.data?.items?.[0]
  patternId = item?.pattern_id ?? null
}

const backToLibrary = () => {
  goBackWithTransition(router, '/home/pattern-library')
}

const loadDetail = async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 })
  try {
    await resolvePatternId()
    if (!patternId) {
      closeToast()
      showToast('版式不存在')
      backToLibrary()
      return
    }
    const res = await getPatternInfo(patternId, { loading: false })
    const d = res?.data
    detail.value = d
    form.value = {
      memo: d.memo || '',
      tags: d.tags || [],
      is_active: d.is_active,
      mainImageId: d.main_image?.rid || null,
      mainImageFile: null,
      imageIds: (d.images || []).map((img) => img.rid),
      newImageFiles: [],
    }
    mainImageFileList.value = d.main_image ? [{ url: d.main_image.url, rid: d.main_image.rid }] : []
    subImageFileList.value = (d.images || []).map((img) => ({ url: img.url, rid: img.rid }))
  } finally {
    closeToast()
  }
}

// 图片预览
const previewMain = () => {
  if (detail.value?.main_image?.url) {
    showImagePreview([detail.value.main_image.url])
  }
}
const previewImages = (index = 0) => {
  const urls = detail.value?.images?.map((img) => img.url) || []
  if (urls.length) showImagePreview({ images: urls, startPosition: index })
}

// 主图上传
const onMainImageRead = ({ file }) => {
  form.value.mainImageFile = file
  form.value.mainImageId = null
}
const onMainImageDelete = () => {
  form.value.mainImageFile = null
  form.value.mainImageId = null
}

// 辅图上传
const onSubImageRead = () => {
  syncSubImages()
}
const onSubImageDelete = (_, { index }) => {
  subImageFileList.value.splice(index, 1)
  syncSubImages()
}
const syncSubImages = () => {
  form.value.imageIds = subImageFileList.value.filter((f) => f.rid).map((f) => f.rid)
  form.value.newImageFiles = subImageFileList.value.filter((f) => f.file).map((f) => f.file)
}

// 下架
const onDeactivate = async () => {
  try {
    await showConfirmDialog({ title: '确认下架', message: `确定下架版式「${detail.value.code}」吗？` })
  } catch {
    return
  }
  try {
    await deactivatePattern(patternId, { loading: false })
    showToast('已下架')
    backToLibrary()
  } catch {}
}

// 重新上架
const onActivate = async () => {
  try {
    await showConfirmDialog({ title: '确认上架', message: `确定上架版式《${detail.value.code}》吗？` })
  } catch {
    return
  }
  try {
    await activatePattern(patternId, { loading: false })
    showToast('已上架')
    await loadDetail()
  } catch {}
}

const onSubmit = async () => {
  if (submitting.value) return
  submitting.value = true
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 })
  try {
    const fd = new FormData()
    fd.append('code', patternCode)
    fd.append('memo', form.value.memo)
    fd.append('is_active', form.value.is_active)
    form.value.tags.map((t) => t.trim()).filter(Boolean)
      .forEach((t) => fd.append('tags', t))
    if (form.value.mainImageFile) {
      fd.append('main_image', form.value.mainImageFile)
    } else if (form.value.mainImageId) {
      fd.append('main_image_id', form.value.mainImageId)
    }
    form.value.imageIds.forEach((id) => fd.append('image_ids', id))
    form.value.newImageFiles.forEach((f) => fd.append('images', f))
    await updatePattern(fd, { loading: false })
    closeToast()
    showToast('保存成功')
    editing.value = false
    await loadDetail()
  } catch {
    closeToast()
  } finally {
    submitting.value = false
  }
}

const onEdit = () => {
  editing.value = true
}

const onCancel = async () => {
  try {
    await showConfirmDialog({ title: '提示', message: '放弃编辑？' })
    editing.value = false
    await loadDetail()
  } catch {}
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

const onClickLeft = () => {
  if (editing.value) {
    onCancel()
    return
  }
  backToLibrary()
}

onMounted(loadDetail)
</script>

<template>
  <div class="page">
    <div v-if="detail">
      <!-- 主图 Hero -->
      <div class="hero" @click="previewMain">
        <van-image
          v-if="detail.main_image"
          :src="detail.main_image.url"
          width="100%"
          height="260"
          fit="cover"
          class="hero-img"
        />
        <div v-else class="hero-empty">
          <van-icon name="photo-o" size="48" color="#cbd5e1" />
          <span>暂无主图</span>
        </div>
        <!-- 渐变遮罩 -->
        <div class="hero-top-mask" />
        <!-- 返回按钮 -->
        <button class="float-back" @click.stop="onClickLeft">
          <van-icon name="arrow-left" size="18" />
        </button>
        <div v-if="detail.main_image" class="hero-mask">
          <van-icon name="eye-o" size="20" color="rgba(255,255,255,0.8)" />
        </div>
        <!-- 状态角标，移到右上角 -->
        <div class="status-badge" :class="detail.is_active ? 'active' : 'inactive'">
          {{ detail.is_active ? '已上架' : '已下架' }}
        </div>
      </div>

      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="info-header">
          <div class="code-text">{{ detail.code }}</div>
          <div v-if="!editing" class="action-row">
            <button v-if="!detail.is_active" class="btn-activate" @click="onActivate">
              <van-icon name="success" />上架
            </button>
            <button class="btn-edit" @click="onEdit">
              <van-icon name="edit" />编辑
            </button>
            <button v-if="detail.is_active" class="btn-deactivate" @click="onDeactivate">
              <van-icon name="close" />下架
            </button>
          </div>
          <div v-else class="action-row">
            <button class="btn-cancel" @click="onCancel">取消</button>
            <button class="btn-save" :disabled="submitting" @click="onSubmit">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>

        <!-- 查看模式 -->
        <template v-if="!editing">
          <div class="info-row">
            <span class="info-label">备注</span>
            <span class="info-value">{{ detail.memo || '-' }}</span>
          </div>
          <div class="info-row" v-if="detail.tags?.length">
            <span class="info-label">标签</span>
            <div class="tag-list">
              <span v-for="tag in detail.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </template>

        <!-- 编辑模式 -->
        <template v-else>
          <van-cell-group class="edit-group">
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
        </template>
      </div>

      <!-- 辅图区域 -->
      <template v-if="!editing">
        <div class="section">
          <div class="section-title">辅图 · {{ detail.images?.length || 0 }}张</div>
          <template v-if="detail.images?.length">
            <van-swipe :loop="false" :width="200" class="img-swipe">
              <van-swipe-item
                v-for="(img, idx) in detail.images"
                :key="img.rid"
                @click="previewImages(idx)"
              >
                <van-image
                  :src="img.url"
                  width="188"
                  height="140"
                  fit="cover"
                  radius="10"
                  class="swipe-img"
                />
              </van-swipe-item>
            </van-swipe>
          </template>
          <div v-else class="no-images">暂无附图</div>
        </div>
      </template>

      <!-- 编辑模式辅图 -->
      <template v-else>
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
      </template>

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
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 34%),
    radial-gradient(circle at 90% 10%, rgba(14, 165, 233, 0.1), transparent 24%),
    linear-gradient(180deg, #f3f6fb 0%, #f8fafc 100%);
  padding-bottom: 40px;
}

.float-back {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  left: 12px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: none;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.hero-top-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 90px;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.22), transparent);
  pointer-events: none;
}

/* ── Hero 主图 ── */
.hero {
  position: relative;
  width: 100%;
  height: 260px;
  background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%);
  cursor: pointer;
  overflow: hidden;
}

.hero-img {
  display: block;
}

.hero-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
}

.hero-mask {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.32);
  border-radius: 20px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(6px);
}

.status-badge {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.4px;
  backdrop-filter: blur(6px);
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.16);
  color: #047857;
  border: 1px solid rgba(34, 197, 94, 0.22);
}

.status-badge.inactive {
  background: rgba(15, 23, 42, 0.3);
  color: rgba(255, 255, 255, 0.95);
}

/* ── 信息卡片 ── */
.info-card {
  margin: -20px 14px 0;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 18px 16px 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.code-text {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.4px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.btn-edit,
.btn-deactivate,
.btn-activate,
.btn-cancel,
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
}

.btn-edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.btn-deactivate {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-activate {
  background: #dcfce7;
  color: #047857;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-save {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.18);
}

.btn-save:disabled {
  opacity: 0.6;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #eef2f7;
}

.info-label {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
  width: 34px;
}

.info-value {
  font-size: 14px;
  color: #334155;
  flex: 1;
  line-height: 1.7;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.tag-edit-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  margin: 6px 0 2px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 14px;
}

.tag-edit-list :deep(.van-tag) {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
}

.tag-dialog-body {
  padding: 8px 16px 4px;
}

.edit-group {
  margin: 0 -16px;
}

/* ── 辅图区域 ── */
.section {
  margin: 16px 14px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 10px;
  letter-spacing: 0.4px;
}

.img-swipe {
  padding: 4px 0 8px;
}

.no-images {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  padding: 24px 0;
}

.swipe-img {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

:deep(.van-cell),
:deep(.van-field),
:deep(.van-cell-group) {
  background: transparent;
}

:deep(.van-cell) {
  color: #334155;
}

:deep(.van-cell__title) {
  color: #64748b;
}

:deep(.van-field__control) {
  color: #0f172a;
}

:deep(.van-uploader__upload),
:deep(.van-uploader__preview) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.van-uploader__upload) {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

:deep(.van-switch) {
  transform: scale(0.98);
}
</style>
