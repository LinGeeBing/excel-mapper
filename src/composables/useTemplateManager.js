// useTemplateManager.js
import { ref, watch } from 'vue' // ⚠️ 注意：要引入 watch

const STORAGE_KEY = 'consistency_templates'

/* 读取模板 */
const loadTemplates = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

/* 保存模板 */
const saveTemplates = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/* 响应式数据：⚠️ 这里必须读取本地数据！ */
const templates = ref(loadTemplates())
const selectedTemplateId = ref(null)

/* ⚠️ 关键修复：监听变化自动保存 */
watch(templates, (val) => {
  saveTemplates(val)
}, { deep: true })

/* 选择模板 */
const selectTemplate = (id) => {
  selectedTemplateId.value = id
}

/* 新增模板 */
const addTemplate = (template) => {
  const newTemplate = {
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString()
  }
  templates.value.push(newTemplate)
}

/* 删除模板 */
const deleteTemplate = (id) => {
  templates.value = templates.value.filter(t => t.id !== id)
}

/* 更新模板 */
const updateTemplate = (id, newData) => {
  const index = templates.value.findIndex(t => t.id === id)
  if (index > -1) {
    templates.value[index] = {
      ...templates.value[index],
      ...newData,
      updatedAt: new Date().toLocaleString()
    }
  }
}

/* 手动保存（用于拖动排序） */
const saveAllTemplates = () => {
  saveTemplates(templates.value)
}

export function useTemplateManager() {
  return {
    templates,
    selectedTemplateId,
    selectTemplate,
    addTemplate,
    deleteTemplate,
    updateTemplate,
    saveAllTemplates
  }
}