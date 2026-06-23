<template>
  <div class="consistency-page">
    <!-- ===== 模板选择区域 ===== -->
    <el-card shadow="never">
      <template #header>
        <span>📋 模板选择</span>
      </template>

      <div class="template-select-row">
        <el-select
          v-model="selectedTemplateId"
          placeholder="请选择模板"
          style="width: 300px"
          @change="onTemplateSelect"
        >
          <el-option
            v-for="tpl in templates"
            :key="tpl.id"
            :label="tpl.name"
            :value="tpl.id"
          />
        </el-select>

        <el-button
          type="primary"
          style="margin-left: 12px"
          @click="dialogVisible = true"
        >
          模板库
        </el-button>
      </div>

      <div v-if="activeTemplate" style="margin-top: 12px; color: #409EFF">
        当前使用模板：{{ activeTemplate.name }}
      </div>
    </el-card>

    <!-- ===== 模板库弹窗 ===== -->
    <el-dialog
      v-model="dialogVisible"
      title="模板库"
      width="800px"
      @opened="enableTemplateDrag"
    >
      <div class="dialog-header-buttons">
        <el-button type="success" plain @click="openCustomTemplate">
          自定义模板
        </el-button>
        <el-button type="primary" plain @click="openUploadDialog">
          上传模板
        </el-button>
      </div>

      <el-table
        ref="templateTableRef"
        :data="templates"
        style="margin-top: 16px"
        border
        height="450"
        row-key="id"
      >
        <el-table-column label="模板名称" width="135">
          <template #default="{ row }">
            <div class="template-drag-handle">
              {{ row.name }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="headers" label="表头" width="500">
          <template #default="{ row }">
            <div
              style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; line-height: 1.5; max-height: 4.5em;"
              :title="row.headers.join(' / ')"
            >
              {{ row.headers.join(' / ') }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="135">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEditTemplate(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteTemplate(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewDialogVisible" title="预览（前4行）" width="700px">
      <div v-if="previewRows.length">
        <el-table :data="previewRows" style="width:100%" border height="350">
          <el-table-column
            v-for="(h, idx) in templateHeaders"
            :key="idx"
            :label="h || ('列' + (idx+1))"
          >
            <template #default="{ row }">
              {{ row[idx] }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 字段定义弹窗 -->
    <el-dialog v-model="mappingDialogVisible" title="字段定义" width="850px">
      <div style="margin-bottom: 16px; display: flex; align-items: center;">
        <span style="font-weight: bold; margin-right: 8px;">模板名称：</span>
        <el-input
          ref="templateNameInputRef"
          v-model="templateName"
          style="width: 250px;"
          placeholder="请输入模板名称"
        />
        <el-button type="success" plain style="margin-left: 16px;" @click="addField">
          添加字段
        </el-button>
      </div>

      <el-table
        ref="fieldTableRef"
        :data="mappingFields"
        border
        height="350"
        row-key="name"
        :row-class-name="tableRowClassName"
        @cell-click="handleCellClick"
        :cell-style="cellStyle"
      >
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            <div class="drag-handle">
              {{ $index + 1 }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="数据字段">
          <template #default="{ row, $index }">
            <div @dblclick="editField($index)">
              <el-input
                v-if="editingFieldIndex === $index"
                v-model="row.name"
                @blur="finishEdit($index)"
                @keyup.enter="finishEdit($index)"
                v-focus
              />
              <span v-else>{{ row.name || '（空）' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="匹配字段" width="250">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ row.matches?.join(' / ') || '（无）' }}
              </span>
              <el-icon
                style="cursor: pointer; color: #409EFF; flex-shrink: 0;"
                @click="openMatchDialog(row)"
              >
                <Edit />
              </el-icon>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="必填" width="80" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 40px;">
              <el-icon v-if="row.required" color="#67C23A" size="20"><Check /></el-icon>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-tooltip content="删除字段" placement="top">
              <el-button
                :icon="Delete"
                @click="handleDeleteField($index)"
                class="delete-field-btn"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="cancelMapping">取消</el-button>
        <el-button type="primary" @click="saveTemplateFromMapping">保存模版</el-button>
      </template>
    </el-dialog>

    <!-- 匹配字段管理弹窗 -->
    <el-dialog v-model="matchDialogVisible" :title="matchDialogTitle" width="500px">
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <el-input
          v-model="matchSearch"
          placeholder="搜索匹配字段"
          clearable
          style="flex: 1;"
        />
        <el-button type="primary" @click="addMatchField">
          添加匹配字段
        </el-button>
      </div>

      <el-table :data="tempMatches" border height="300">
        <el-table-column label="匹配字段">
          <template #default="{ row, $index }">
            <div
              v-if="!matchSearch || row.value.includes(matchSearch.trim())"
              @dblclick="editMatch($index)"
            >
              <el-input
                v-if="editingMatchIndex === $index"
                v-model="row.value"
                size="small"
                @blur="finishMatchEdit($index)"
                @keyup.enter="finishMatchEdit($index)"
                v-focus
              />
              <span v-else>{{ row.value }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row, $index }">
            <el-icon
              v-if="isSameNameMatch(row.value)"
              style="cursor: not-allowed; color: #c0c4cc;"
              @click="showSameNameTip"
            >
              <Close />
            </el-icon>
            <el-icon
              v-else
              style="cursor: pointer; color: #f56c6c;"
              @click="removeMatch($index)"
            >
              <Close />
            </el-icon>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="matchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMatches">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传模板弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传模板" width="500px">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="templateName" placeholder="例如：订单标准模板" />
        </el-form-item>

        <el-form-item label="上传文件">
          <el-upload
            ref="uploadRef"
            class="template-uploader"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleTemplateUpload"
            accept=".xlsx,.xls,.csv"
            :limit="1"
            :on-exceed="handleExceed"
          >
            <el-icon size="40"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击选择</em>
            </div>
            <template #file="{ file }">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #f5f7fa; border-radius: 4px; margin-top: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.name }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <el-icon style="cursor: pointer;" @click="handleRemove"><Close /></el-icon>
                  <el-button type="primary" link size="small" @click="openPreviewDialog">预览</el-button>
                </div>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmUpload"
          :disabled="!templateHeaders.length"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 上传原表弹窗 ===== -->
    <el-dialog v-model="sourceUploadVisible" title="上传原表" width="500px">
      <el-form label-width="80px">
        <el-form-item label="原表名称">
          <el-input v-model="sourceTableName" placeholder="自动填入文件名" />
        </el-form-item>

        <el-form-item label="上传文件">
          <el-upload
            ref="sourceUploadRef"
            class="template-uploader"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleSourceUpload"
            accept=".xlsx,.xls,.csv"
            :limit="1"
          >
            <el-icon size="40"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击选择</em>
            </div>
            <template #file="{ file }">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #f5f7fa; border-radius: 4px; margin-top: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.name }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <el-icon style="cursor: pointer;" @click="handleSourceRemove"><Close /></el-icon>
                  <el-button type="primary" link size="small" @click="openSourcePreview">预览</el-button>
                </div>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="sourceUploadVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="openFieldMatchDialog"
          :disabled="!sourceHeaders.length"
        >
          字段匹配
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 原表预览弹窗 ===== -->
    <el-dialog v-model="sourcePreviewVisible" title="原表预览" width="900px">
      <el-table :data="sourceRows" style="width:100%" border height="500">
        <el-table-column
          v-for="(h, idx) in sourceHeaders"
          :key="idx"
          :label="h || ('列' + (idx+1))"
        >
          <template #default="{ row }">
            {{ row[idx] }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="sourcePreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ===== 字段匹配弹窗 ===== -->
    <el-dialog v-model="fieldMatchVisible" :title="sourceTableName || '字段匹配'" width="900px">
      <div style="margin-bottom: 12px; color: #909399; font-size: 13px;">
        ※ 表示必填字段，可直接输入常量（如“淘宝”）
      </div>

      <el-table :data="fieldMatchList" border height="420">
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>

        <!-- 必填字段显示 ※字段名（红色） -->
        <el-table-column label="模板字段" width="220">
          <template #default="{ row }">
            <span
              v-if="row.required"
              style="color: #f56c6c; font-weight: bold;"
            >
              ※{{ row.templateField }}
            </span>
            <span v-else>{{ row.templateField }}</span>
          </template>
        </el-table-column>

        <!-- ✅ 原表字段：输入框占满单元格 -->
        <el-table-column label="原表字段">
          <template #default="{ row }">
            <div
              @click="startEditSource(row)"
              style="width: 100%; min-height: 36px; display: flex; align-items: center; cursor: text;"
            >
              <!-- 非编辑状态 -->
              <div
                v-if="editingSourceRow !== row"
                style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; width: 100%;"
              >
                <el-tag
                  v-for="(f, i) in row.sourceFields"
                  :key="i"
                  type="info"
                  closable
                  @close="removeSourceField(row, i)"
                  style="margin: 2px;"
                >
                  {{ f }}
                </el-tag>
                <span v-if="!row.sourceFields.length" style="color: #c0c4cc; font-size: 13px;">
                  点击输入或选择字段
                </span>
              </div>

              <!-- ✅ 编辑状态：输入框 + 下拉 -->
              <div
                v-else
                style="display: flex; align-items: center; width: 100%; gap: 8px;"
              >
                <!-- ✅ 主输入框：输入常量 -->
                <el-input
                  v-model="row._inputText"
                  placeholder="可直接输入常量，如：淘宝"
                  size="small"
                  style="flex: 1;"
                  @keyup.enter="applyInput(row)"
                  @blur="applyInput(row)"
                  v-focus
                />

                <!-- ✅ 下拉：只用于选择原表字段 -->
                <el-select
                  v-model="row._selectFields"
                  multiple
                  filterable
                  placeholder="选择字段"
                  size="small"
                  style="width: 200px;"
                  @change="onSelectChange(row, $event)"
                >
                  <el-option
                    v-for="h in sourceHeaders"
                    :key="h"
                    :label="h"
                    :value="h"
                  />
                </el-select>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="cancelFieldMatch">取消</el-button>
        <el-button type="info" plain @click="sourcePreviewVisible = true">
          查看原表
        </el-button>
        <el-button type="primary" @click="confirmFieldMatch">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 模板化结果预览弹窗 ===== -->
    <el-dialog v-model="resultPreviewVisible" :title="previewingRecord?.name || '预览'" width="900px">
      <el-table :data="resultPreviewRows" style="width:100%" border height="500">
        <el-table-column
          v-for="(h, idx) in resultPreviewHeaders"
          :key="idx"
          :label="h"
        >
          <template #default="{ row }">
            {{ row[idx] }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="resultPreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 表格整理区域 -->
    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <span>📊 表格整理</span>
      </template>

      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <el-button type="primary" @click="handleSourceUploadClick">
          上传原表
        </el-button>
        <el-button type="warning" @click="handleMergeTables">
          合并表格
        </el-button>
      </div>

      <!-- 原表处理记录表格 -->
      <el-table
        :data="filteredSourceTableData"
        border
        style="margin-top: 12px;"
        @selection-change="handleSourceSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="原表名称" prop="name" />
        <el-table-column label="操作时间" prop="time" width="180" />
        <el-table-column label="操作" width="280" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="previewResult(row)">
              预览
            </el-button>
            <el-button size="small" type="success" link @click="exportSingle(row)">
              导出
            </el-button>
            <el-button size="small" type="warning" link @click="editRecord(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Check, Document, Close, Delete, Edit } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import * as XLSX from 'xlsx'
import { useTemplateManager } from '../composables/useTemplateManager'

const {
  templates,
  selectedTemplateId,
  selectTemplate,
  addTemplate,
  deleteTemplate,
  updateTemplate
} = useTemplateManager()

/* ===== 原有状态 ===== */
const dialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const uploadRef = ref(null)
const fieldTableRef = ref(null)
const templateTableRef = ref(null)
const templateNameInputRef = ref(null)

const templateName = ref('')
const templateHeaders = ref([])
const previewRows = ref([])
const editingTemplateId = ref(null)

const activeTemplate = computed(() =>
  templates.value.find(t => t.id === selectedTemplateId.value) || null
)

const onTemplateSelect = (id) => {
  selectTemplate(id)
}

/* ===== 原有方法 ===== */
const openCustomTemplate = () => {
  templateName.value = ''
  mappingFields.value = []
  editingTemplateId.value = null
  dialogVisible.value = false
  mappingDialogVisible.value = true
  nextTick(() => {
    templateNameInputRef.value?.focus()
    enableFieldDrag()
  })
}

const openUploadDialog = () => {
  templateName.value = ''
  templateHeaders.value = []
  previewRows.value = []
  editingTemplateId.value = null
  if (uploadRef.value) uploadRef.value.clearFiles()
  uploadDialogVisible.value = true
}

const handleDeleteTemplate = (row) => {
  ElMessageBox.confirm(`确定要删除模板 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    deleteTemplate(row.id)
    if (selectedTemplateId.value === row.id) selectedTemplateId.value = null
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleEditTemplate = (row) => {
  templateName.value = row.name
  editingTemplateId.value = row.id

  mappingFields.value = row.headers.map(h => ({
    name: h || '',
    required: row.requiredFields?.includes(h) || false,
    matches: [h || '']
  }))

  editingFieldIndex.value = -1
  dialogVisible.value = false
  mappingDialogVisible.value = true
  nextTick(enableFieldDrag)
}

const handleRemove = () => {
  if (uploadRef.value) uploadRef.value.clearFiles()
  templateHeaders.value = []
  previewRows.value = []
}

const handleExceed = (files) => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
    uploadRef.value.handleStart(files[0])
  }
}

const handleTemplateUpload = (file) => {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const buffer = e.target.result
      let workbook

      if (isCSV) {
        let text = ''
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
        } catch {
          text = new TextDecoder('gbk').decode(buffer)
        }
        workbook = XLSX.read(text, { type: 'string', sheetRows: 4 })
      } else {
        workbook = XLSX.read(buffer, { type: 'array', sheetRows: 4, dense: true })
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })

      if (!aoa.length) {
        ElMessage.warning('模板为空')
        return
      }

      templateHeaders.value = aoa[0].map(v => (v == null ? '' : String(v)))
      previewRows.value = aoa.slice(0, 4).map(r => r.map(v => (v == null ? '' : String(v))))
      ElMessage.success('已上传')
    } catch {
      ElMessage.error('文件解析失败')
    }
  }

  reader.readAsArrayBuffer(isCSV ? file.raw.slice(0, 1024 * 1024) : file.raw)
}

const openPreviewDialog = () => {
  previewDialogVisible.value = true
}

const previewDialogVisible = ref(false)

const mappingFields = ref([])
const editingFieldIndex = ref(-1)

const vFocus = {
  mounted(el) {
    el.querySelector('input')?.focus()
  }
}

const cellStyle = ({ column }) => {
  if (column.label === '必填') {
    return { cursor: 'pointer', padding: 0 }
  }
}

const handleCellClick = (row, column) => {
  if (column.label === '必填') {
    row.required = !row.required
  }
}

const tableRowClassName = ({ row }) => {
  return row.required ? 'required-row' : ''
}

const initMappingFields = () => {
  mappingFields.value = templateHeaders.value.map(h => ({
    name: h || '',
    required: false,
    matches: [h || '']
  }))
  editingFieldIndex.value = -1
}

const enableFieldDrag = () => {
  nextTick(() => {
    const tableBody = fieldTableRef.value?.$el?.querySelector('.el-table__body-wrapper tbody')
    if (!tableBody) return

    Sortable.create(tableBody, {
      animation: 200,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd({ newIndex, oldIndex }) {
        if (newIndex === oldIndex) return
        const curr = mappingFields.value.splice(oldIndex, 1)[0]
        mappingFields.value.splice(newIndex, 0, curr)
      }
    })
  })
}

const enableTemplateDrag = () => {
  nextTick(() => {
    const tableBody = templateTableRef.value?.$el?.querySelector('.el-table__body-wrapper tbody')
    if (!tableBody) return

    Sortable.create(tableBody, {
      animation: 200,
      handle: '.template-drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd({ newIndex, oldIndex }) {
        if (newIndex === oldIndex) return
        const curr = templates.value.splice(oldIndex, 1)[0]
        templates.value.splice(newIndex, 0, curr)
      }
    })
  })
}

const confirmUpload = () => {
  if (!templateName.value.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }

  if (templates.value.some(t => t.name === templateName.value.trim() && t.id !== editingTemplateId.value)) {
    ElMessage.warning('模板名称已存在')
    return
  }

  uploadDialogVisible.value = false
  initMappingFields()
  mappingDialogVisible.value = true
  nextTick(enableFieldDrag)
}

const mappingDialogVisible = ref(false)

const addField = () => {
  mappingFields.value.push({
    name: '',
    required: false,
    matches: ['']
  })
  editField(mappingFields.value.length - 1)
}

const editField = (idx) => {
  editingFieldIndex.value = idx
}

const finishEdit = (idx) => {
  editingFieldIndex.value = -1
}

const handleDeleteField = (idx) => {
  const name = mappingFields.value[idx]?.name || '该字段'
  ElMessageBox.confirm(`确定要删除字段 "${name}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    mappingFields.value.splice(idx, 1)
    ElMessage.success('字段已删除')
  }).catch(() => {})
}

const cancelMapping = () => {
  mappingDialogVisible.value = false
  dialogVisible.value = true
}

/* ===== 匹配字段管理 ===== */
const matchDialogVisible = ref(false)
const matchSearch = ref('')
const editingMatchIndex = ref(-1)
const currentMatchField = ref(null)
const tempMatches = ref([])

const matchDialogTitle = computed(() => {
  return currentMatchField.value?.name || '匹配字段'
})

const openMatchDialog = (row) => {
  currentMatchField.value = row
  matchSearch.value = ''
  editingMatchIndex.value = -1
  tempMatches.value = row.matches.map(m => ({ value: m }))
  matchDialogVisible.value = true
}

const isSameNameMatch = (matchValue) => {
  return matchValue === currentMatchField.value?.name
}

const showSameNameTip = () => {
  ElMessage.warning('同名字段不可删除')
}

const editMatch = (idx) => {
  const matchValue = (tempMatches.value[idx].value || '').trim()
  const fieldName = (currentMatchField.value?.name || '').trim()

  if (matchValue && fieldName && matchValue === fieldName) {
    ElMessage.warning('同名字段不可修改')
    return
  }

  editingMatchIndex.value = idx
}

const finishMatchEdit = (idx) => {
  editingMatchIndex.value = -1
}

const removeMatch = (idx) => {
  tempMatches.value.splice(idx, 1)
}

const addMatchField = () => {
  tempMatches.value.push({ value: '' })
  editMatch(tempMatches.value.length - 1)
}

const saveMatches = () => {
  const values = tempMatches.value.map(m => m.value.trim())

  if (values.includes('')) {
    ElMessage.warning('存在空的匹配字段，请修改后重试')
    return
  }

  const duplicates = [...new Set(
    values.filter((v, i, arr) => arr.indexOf(v) !== i)
  )]

  if (duplicates.length > 0) {
    ElMessage.warning(`"${duplicates.join('、')}" 重复，请修改后重试`)
    return
  }

  if (currentMatchField.value) {
    currentMatchField.value.matches = values
  }

  matchDialogVisible.value = false
}

/* ===== 保存模板 ===== */
const saveTemplateFromMapping = async () => {
  const name = templateName.value.trim()
  if (!name) {
    ElMessage.warning('请输入模板名称')
    return
  }

  if (mappingFields.value.length === 0) {
    ElMessage.warning('请至少添加一个数据字段')
    return
  }

  const fieldNames = mappingFields.value.map(f => f.name?.trim()).filter(Boolean)
  if (fieldNames.length === 0) {
    ElMessage.warning('数据字段不能为空')
    return
  }

  const duplicates = [...new Set(
    fieldNames.filter((v, i, arr) => arr.indexOf(v) !== i)
  )]

  if (duplicates.length > 0) {
    try {
      await ElMessageBox.confirm(
        `"${duplicates.join('、')}" 出现重复，是否继续保存？`,
        '字段重复提示',
        {
          type: 'warning',
          confirmButtonText: '继续保存',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }
  }

  const isDuplicate = templates.value.some(
    t => t.name === name && t.id !== editingTemplateId.value
  )
  if (isDuplicate) {
    ElMessage.warning('模板名称已存在')
    return
  }

  const requiredFields = mappingFields.value
    .filter(f => f.required)
    .map(f => f.name)

  const payload = {
    name,
    headers: fieldNames,
    requiredFields
  }

  if (editingTemplateId.value) {
    updateTemplate(editingTemplateId.value, payload)
    ElMessage.success('模板更新成功')
  } else {
    addTemplate(payload)
    ElMessage.success('模板保存成功')
  }

  editingTemplateId.value = null
  mappingDialogVisible.value = false
}

/* ============================
   ✅ 原表 & 字段匹配
   ============================ */

const sourceUploadVisible = ref(false)
const sourceTableName = ref('')
const sourceHeaders = ref([])
const sourceRows = ref([])
const sourceUploadRef = ref(null)

const sourcePreviewVisible = ref(false)
const fieldMatchVisible = ref(false)
const fieldMatchList = ref([])
const editingSourceRow = ref(null)

const sourceTableData = ref([])
const selectedSourceRecords = ref([])

const resultPreviewVisible = ref(false)
const previewingRecord = ref(null)
const resultPreviewHeaders = ref([])
const resultPreviewRows = ref([])

const filteredSourceTableData = computed(() => {
  return sourceTableData.value.filter(
    r => r.templateId === selectedTemplateId.value
  )
})

const handleSourceUploadClick = () => {
  if (!activeTemplate.value) {
    ElMessage.warning('请先选择模板')
    return
  }
  sourceTableName.value = ''
  sourceHeaders.value = []
  sourceRows.value = []
  if (sourceUploadRef.value) sourceUploadRef.value.clearFiles()
  sourceUploadVisible.value = true
}

const handleSourceUpload = (file) => {
  sourceTableName.value = file.name.replace(/\.(xlsx|xls|csv)$/, '')

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = e.target.result
    const workbook = XLSX.read(data, { type: 'binary' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    sourceHeaders.value = aoa[0].map(v => String(v ?? ''))
    sourceRows.value = aoa.slice(1).map(r => r.map(v => String(v ?? '')))
  }
  reader.readAsBinaryString(file.raw)
}

const handleSourceRemove = () => {
  if (sourceUploadRef.value) sourceUploadRef.value.clearFiles()
  sourceHeaders.value = []
  sourceRows.value = []
}

const openSourcePreview = () => {
  sourcePreviewVisible.value = true
}

/* ✅ 打开字段匹配 */
const openFieldMatchDialog = () => {
  if (!activeTemplate.value) {
    ElMessage.warning('请先选择模板')
    return
  }
  if (!sourceHeaders.value.length) {
    ElMessage.warning('请先上传原表文件')
    return
  }

  fieldMatchList.value = activeTemplate.value.headers.map(h => ({
    templateField: h,
    required: activeTemplate.value.requiredFields?.includes(h) || false,
    sourceFields: [],
    _inputText: '',
    _selectFields: []
  }))

  sourceUploadVisible.value = false
  fieldMatchVisible.value = true
}

/* ✅ 单击进入编辑 */
const startEditSource = (row) => {
  editingSourceRow.value = row
}

/* ✅ 下拉选择字段 */
const onSelectChange = (row, values) => {
  row._selectFields = values
  row.sourceFields = [...values]
}

/* ✅ 输入常量 */
const applyInput = (row) => {
  const text = row._inputText?.trim()
  if (text) {
    row.sourceFields = [text]
  }
  editingSourceRow.value = null
}

/* ✅ 删除字段 */
const removeSourceField = (row, index) => {
  row.sourceFields.splice(index, 1)
  row._selectFields = [...row.sourceFields]
  row._inputText = ''
}

/* ✅ 取消 */
const cancelFieldMatch = () => {
  editingRecord.value = null
  fieldMatchVisible.value = false
}

/* ✅ 确认字段匹配 */
const confirmFieldMatch = () => {
  const miss = fieldMatchList.value.find(
    f => f.required && f.sourceFields.length === 0
  )

  if (miss) {
    ElMessage.warning(`"${miss.templateField}"为必填字段，请完成匹配`)
    return
  }

  const result = generateMappedData()

  if (editingRecord.value) {
    editingRecord.value.result = result
    editingRecord.value.name = sourceTableName.value || editingRecord.value.name
    editingRecord.value.time = getCurrentTime()
    editingRecord.value = null
    ElMessage.success('编辑完成')
  } else {
    addSourceRecord(result)
    ElMessage.success('字段匹配完成')
  }

  fieldMatchVisible.value = false
}

/* ✅ 生成映射数据 */
const generateMappedData = () => {
  const headers = fieldMatchList.value.map(f => f.templateField)
  const rows = []

  for (const srcRow of sourceRows.value) {
    const newRow = []
    for (const field of fieldMatchList.value) {
      if (field.sourceFields.length === 0) {
        newRow.push('')
      } else if (field.sourceFields.length === 1) {
        const val = field.sourceFields[0]
        if (sourceHeaders.value.includes(val)) {
          const colIdx = sourceHeaders.value.indexOf(val)
          newRow.push(colIdx >= 0 ? srcRow[colIdx] : '')
        } else {
          newRow.push(val)
        }
      } else {
        const values = field.sourceFields.map(sf => {
          if (sourceHeaders.value.includes(sf)) {
            const colIdx = sourceHeaders.value.indexOf(sf)
            return colIdx >= 0 ? (srcRow[colIdx] || '') : ''
          } else {
            return sf
          }
        })
        newRow.push(values.join(' & '))
      }
    }
    rows.push(newRow)
  }

  return { headers, rows }
}

const getCurrentTime = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/* ✅ 添加原表记录 */
const addSourceRecord = (result) => {
  sourceTableData.value.push({
    id: Date.now(),
    name: sourceTableName.value || '未命名原表',
    templateId: selectedTemplateId.value,
    time: getCurrentTime(),
    result
  })
}

const handleSourceSelectionChange = (selection) => {
  selectedSourceRecords.value = selection
}

/* ✅ 预览 */
const previewResult = (row) => {
  previewingRecord.value = row
  resultPreviewHeaders.value = row.result.headers
  resultPreviewRows.value = row.result.rows
  resultPreviewVisible.value = true
}

/* ✅ 导出（✅ Blob + a.click） */
const exportSingle = (row) => {
  try {
    const ws = XLSX.utils.aoa_to_sheet([
      row.result.headers,
      ...row.result.rows
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.name}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

/* ✅ 编辑记录（✅ 完整回显） */
const editingRecord = ref(null)

const editRecord = (row) => {
  editingRecord.value = row
  sourceTableName.value = row.name

  fieldMatchList.value = row.result.headers.map((h, i) => ({
    templateField: h,
    required: activeTemplate.value?.requiredFields?.includes(h) || false,
    sourceFields: [],
    _inputText: '',
    _selectFields: []
  }))

  const firstDataRow = row.result.rows[0] || []
  fieldMatchList.value.forEach((f, i) => {
    const cellVal = firstDataRow[i] || ''
    if (!cellVal) return

    if (cellVal.includes(' & ')) {
      f.sourceFields = cellVal.split(' & ').map(s => s.trim())
    } else {
      f.sourceFields = [cellVal]
    }

    if (!sourceHeaders.value.includes(f.sourceFields[0])) {
      f._inputText = f.sourceFields[0]
    } else {
      f._selectFields = [...f.sourceFields]
    }
  })

  fieldMatchVisible.value = true
}

/* ✅ 合并表格 */
const handleMergeTables = async () => {
  if (!activeTemplate.value) {
    ElMessage.warning('请先选择模板')
    return
  }

  const sameTemplate = selectedSourceRecords.value.filter(
    r => r.templateId === selectedTemplateId.value
  )

  if (sameTemplate.length < 2) {
    ElMessage.warning('请至少选择2个同模板的原表进行合并')
    return
  }

  try {
    const { value: mergeName } = await ElMessageBox.prompt(
      '请输入合并后的文件名',
      '合并表格',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '文件名不能为空'
      }
    )

    const firstResult = sameTemplate[0].result
    const headers = [...firstResult.headers]

    const mergedRows = []
    for (const record of sameTemplate) {
      mergedRows.push(...record.result.rows)
    }

    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ...mergedRows
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${mergeName}.xlsx`)

    sourceTableData.value.push({
      id: Date.now(),
      name: mergeName,
      templateId: selectedTemplateId.value,
      time: getCurrentTime(),
      result: { headers, rows: mergedRows }
    })

    ElMessage.success('合并完成')
  } catch {
    /* 用户取消 */
  }
}
</script>

<style scoped>
.consistency-page {
  padding: 10px;
}

/* ✅ 防止弹窗导致菜单右移 */
:global(body.el-popup-parent--hidden) {
  padding-right: 0 !important;
  overflow: auto !important;
}

.template-select-row {
  display: flex;
  align-items: center;
}

.dialog-header-buttons {
  display: flex;
  gap: 12px;
}

.template-uploader {
  width: 100%;
}

.template-uploader :deep(.el-upload-dragger) {
  padding: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.template-uploader :deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
}

.consistency-page :deep(.el-table .required-row) {
  --el-table-tr-bg-color: #f5f7fa;
}

.delete-field-btn {
  background: transparent;
  border: none;
  color: #d64949;
  padding: 0;
  font-size: 18px;
}

.delete-field-btn:hover {
  color: #e04848;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32px;
}

.template-drag-handle {
  cursor: grab;
  user-select: none;
  padding: 8px 0;
}

.consistency-page :deep(.sortable-ghost) {
  opacity: 1 !important;
  background: #e8f4fd;
}

.consistency-page :deep(.sortable-chosen) {
  background: #ffffff !important;
}

.consistency-page :deep(.sortable-drag) {
  opacity: 1 !important;
}
</style>