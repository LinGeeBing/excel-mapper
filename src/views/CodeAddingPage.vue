<template>
  <div class="product-code-page">
    <!-- ===== 模块一：上传文件 ===== -->
    <el-card shadow="never" class="upload-card">
      <div class="card-header">
        <el-button type="primary" @click="openUploadDialog" :disabled="hasUploadedFile">
          上传文件
        </el-button>
      </div>

      <!-- 已上传文件展示区 -->
      <div v-if="hasUploadedFile" class="uploaded-file-area">
        <div class="file-item">
          <div class="file-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="file-name">{{ fileName }}</div>
          <div class="file-actions">
            <el-icon class="delete-btn" @click="handleDeleteConfirm">
              <Close />
            </el-icon>
            <el-button type="primary" link size="small" @click="previewFile">
              预览
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ===== 模块二：商品信息定义 ===== -->
    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <span>📦 定义商品信息</span>
      </template>

      <!-- 字段选择区 -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="font-weight: 500;">选择参与字段：</span>
          <el-select
            v-model="selectedField"
            placeholder="请选择字段"
            style="width: 220px;"
            clearable
            filterable
            @change="addField"
          >
            <el-option
              v-for="h in availableFields"
              :key="h"
              :label="h"
              :value="h"
            />
          </el-select>
        </div>

        <!-- 已选字段列表（可拖拽排序） -->
        <div v-if="selectedFields.length" class="selected-fields">
          <!-- <div style="font-size: 13px; color: #909399; margin-bottom: 8px;">
            拼接顺序（可拖拽调整）：
          </div> -->
          <div
            v-for="(field, index) in selectedFields"
            :key="field"
            class="field-tag"
            style="display: inline-flex; align-items: center; gap: 6px; margin: 4px;"
          >
            <el-tag
              type="primary"
              effect="plain"
              style="cursor: grab; user-select: none;"
              :data-field="field"
            >
              {{ index + 1 }}. {{ field }}
            </el-tag>
            <el-icon
              style="cursor: pointer; color: #f56c6c;"
              @click="removeField(index)"
            >
              <Close />
            </el-icon>
          </div>
        </div>

        <div v-else style="color: #c0c4cc; font-size: 13px;">
          请至少选择一个字段
        </div>
      </div>

      <!-- 操作按钮 -->
      <div style="display: flex; gap: 12px;">
        <el-button
          type="primary"
          :disabled="selectedFields.length === 0"
          @click="previewMapping"
        >
          预览商品信息
        </el-button>
        <el-button
          type="success"
          :disabled="selectedFields.length === 0"
          @click="confirmMapping"
        >
          确认定义
        </el-button>
      </div>
    </el-card>

    <!-- ===== 上传文件弹窗 ===== -->
    <el-dialog v-model="uploadVisible" title="上传商品原表" width="500px">
      <el-form label-width="80px">
        <el-form-item label="上传文件">
          <el-upload
            ref="uploadRef"
            class="file-uploader"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".xlsx,.xls,.csv"
            :limit="1"
            :on-exceed="handleExceed"
          >
            <el-icon size="40"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击选择</em>
            </div>
            <template #file="{ file }">
              <div class="upload-file-preview">
                <div class="file-info">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.name }}</span>
                </div>
                <div class="file-actions">
                  <el-icon style="cursor: pointer;" @click="removeFile">
                    <Close />
                  </el-icon>
                  <el-button type="primary" link size="small" @click="previewFile">
                    预览
                  </el-button>
                </div>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!rawRows.length"
          @click="confirmUpload"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 文件预览弹窗 ===== -->
    <el-dialog v-model="previewVisible" title="文件预览" width="900px">
    <el-table
      :data="previewRows"
      border
      height="500"
      style="width: 100%;"
    >
      <!-- ✅ 原表行号 -->
      <el-table-column
        label="序号"
        width="70"
        align="center"
        fixed="left"
      >
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>

      <el-table-column
        v-for="(col, index) in previewHeaders"
        :key="index"
        :label="col || `列${index + 1}`"
      >
        <template #default="{ row }">
          {{ row[index] }}
        </template>
      </el-table-column>
    </el-table>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ===== 商品信息预览弹窗 ===== -->
    <el-dialog v-model="mappingPreviewVisible" title="商品信息预览" width="900px">
      <div style="margin-bottom: 12px; color: #909399; font-size: 13px;">
        拼接规则：{{ selectedFields.join(' + ') }}
      </div>

    <el-table
      :data="mappingPreviewRows"
      border
      height="450"
      style="width: 100%;"
    >
      <!-- ✅ 原表行号 -->
      <el-table-column
        label="序号"
        width="70"
        align="center"
        fixed="left"
      >
        <template #default="{ row }">
          {{ row.__rowNo }}
        </template>
      </el-table-column>

      <el-table-column
        v-for="(field, index) in selectedFields"
        :key="index"
        :label="field"
        width="180"
      >
        <template #default="{ row }">
          {{ row[field] }}
        </template>
      </el-table-column>

      <el-table-column label="商品信息" min-width="250">
        <template #default="{ row }">
          {{ row.__productInfo }}
        </template>
      </el-table-column>
    </el-table>

      <template #footer>
        <el-button @click="mappingPreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Document, Close } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import * as XLSX from 'xlsx'

/* ===== 上传模块状态 ===== */
const uploadVisible = ref(false)
const previewVisible = ref(false)
const uploadRef = ref(null)

const fileName = ref('')
const rawHeaders = ref([])
const rawRows = ref([])
const previewHeaders = ref([])
const previewRows = ref([])

const hasUploadedFile = computed(
  () => !!fileName.value && rawHeaders.value.length > 0
)

/* ===== 商品信息定义状态 ===== */
const selectedField = ref('')
const selectedFields = ref([])
const mappingPreviewVisible = ref(false)
const mappingPreviewRows = ref([])

/* ===== 可用字段（排除已选） ===== */
const availableFields = computed(() =>
  rawHeaders.value.filter(h => !selectedFields.value.includes(h))
)

/* ===== 上传逻辑（不修改） ===== */
const openUploadDialog = () => {
  uploadVisible.value = true
}

const handleExceed = (files) => {
  uploadRef.value?.clearFiles()
  uploadRef.value?.handleStart(files[0])
}

const handleFileChange = (file) => {
  fileName.value = file.name
  parseFile(file.raw)
}

const parseFile = (file) => {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      let workbook

      if (isCSV) {
        let text = ''
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(e.target.result)
        } catch {
          text = new TextDecoder('gbk').decode(e.target.result)
        }
        workbook = XLSX.read(text, { type: 'string' })
      } else {
        workbook = XLSX.read(e.target.result, { type: 'array', dense: true })
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })

      if (!aoa.length) {
        ElMessage.warning('文件内容为空')
        return
      }

      rawHeaders.value = aoa[0].map(v => (v == null ? '' : String(v)))
      rawRows.value = aoa.slice(1).map(r => r.map(v => (v == null ? '' : String(v))))

      previewHeaders.value = rawHeaders.value
      previewRows.value = rawRows.value

      ElMessage.success('文件解析成功')
    } catch {
      ElMessage.error('文件解析失败')
    }
  }

  if (isCSV) {
    reader.readAsArrayBuffer(file.slice(0, 1024 * 1024))
  } else {
    reader.readAsArrayBuffer(file)
  }
}

const removeFile = () => {
  uploadRef.value?.clearFiles()
  fileName.value = ''
  rawHeaders.value = []
  rawRows.value = []
  previewHeaders.value = []
  previewRows.value = []
}

const confirmUpload = () => {
  uploadVisible.value = false
  ElMessage.success('文件上传成功')
}

const handleDeleteConfirm = () => {
  ElMessageBox.confirm(
    '确定要删除该文件吗？删除后将无法预览，字段定义也会被清空，如需重新上传请点击下方按钮。',
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    removeFile()
    clearMapping() // 清空字段定义
    ElMessage.success('文件已删除')
  })
}

const previewFile = () => {
  if (!rawRows.value.length) {
    ElMessage.warning('暂无文件数据')
    return
  }
  previewVisible.value = true
}

/* ===== 商品信息定义逻辑 ===== */

// 添加字段
const addField = (field) => {
  if (!field) return
  if (selectedFields.value.includes(field)) {
    ElMessage.warning('该字段已添加')
    selectedField.value = ''
    return
  }
  selectedFields.value.push(field)
  selectedField.value = ''
  enableDrag() // 重新绑定拖拽
}

// 移除字段
const removeField = (index) => {
  selectedFields.value.splice(index, 1)
  nextTick(enableDrag)
}

// 清空定义
const clearMapping = () => {
  selectedFields.value = []
  selectedField.value = ''
}

// 拼接商品信息
const buildProductInfo = (row) => {
  return selectedFields.value
    .map(fieldName => {
      const colIndex = rawHeaders.value.indexOf(fieldName)
      if (colIndex === -1) return ''
      return (row[colIndex] ?? '').toString().trim()
    })
    .join('')
}

// 预览
const previewMapping = () => {
  if (selectedFields.value.length === 0) {
    ElMessage.warning('请至少选择一个字段')
    return
  }

  mappingPreviewRows.value = rawRows.value
  .slice(0, 20)
  .map((row, rowIndex) => {
    const obj = {
      __rowNo: rowIndex + 1 // ✅ 原表真实行号
    }
    selectedFields.value.forEach(field => {
      obj[field] = row[rawHeaders.value.indexOf(field)]
    })
    obj.__productInfo = buildProductInfo(row)
    return obj
  })

  mappingPreviewVisible.value = true
}

// 确认定义
const confirmMapping = () => {
  if (selectedFields.value.length === 0) {
    ElMessage.warning('请至少选择一个字段')
    return
  }

  // 为所有行生成商品信息
  rawRows.value.forEach(row => {
    row.__productInfo = buildProductInfo(row)
  })

  ElMessage.success('商品信息定义完成')
  // TODO: 激活「添加编码」按钮
}

/* ===== 拖拽排序 ===== */
let sortableInstance = null

const enableDrag = () => {
  nextTick(() => {
    const container = document.querySelector('.selected-fields')
    if (!container) return

    // 销毁旧实例
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }

    sortableInstance = Sortable.create(container, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      // ✅ 关键：禁止 Sortable 自己操作 DOM，让 Vue 接管
      draggable: '.field-tag',
      onEnd({ newIndex, oldIndex }) {
        if (newIndex === oldIndex) return

        // ✅ 先让 Sortable 还原 DOM（不操作 DOM，只同步数据）
        const item = selectedFields.value.splice(oldIndex, 1)[0]
        selectedFields.value.splice(newIndex, 0, item)

        // ✅ 强制 Vue 重新渲染，避免空白节点残留
        nextTick(() => {
          enableDrag()
        })
      }
    })
  })
}

// 组件卸载时清理
onMounted(() => {
  // 初始化
})
</script>

<style scoped>
/* ✅ 与 ConsistencyPage 完全一致 */
.product-code-page {
  padding: 10px;
}

.upload-card {
  border-radius: 8px;
  background-color: #fff;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

/* ===== 已上传文件区域 ===== */
.uploaded-file-area {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #303133;
}

.file-icon {
  color: #909399;
  font-size: 16px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.delete-btn {
  color: #909399;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s;
}

.delete-btn:hover {
  color: #f56c6c;
}

/* 上传弹窗 */
.file-uploader {
  width: 100%;
}

.file-uploader :deep(.el-upload-dragger) {
  padding: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.file-uploader :deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
}

.upload-file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 商品信息定义区域 ===== */
.selected-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  min-height: 40px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
}

.field-tag {
  margin: 2px 4px;
}

/* 拖拽样式 */
:global(.sortable-ghost) {
  opacity: 0.4;
  background: #e8f4fd;
}

:global(.sortable-chosen) {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:global(.sortable-drag) {
  opacity: 0.8;
}
</style>