<template>
  <div class="period-selector">
    <h3 class="period-selector__title">选择周期类型</h3>
    <div class="period-selector__options">
      <button
        v-for="option in periodOptions"
        :key="option.value"
        class="period-option"
        :class="{ 'period-option--active': modelValue === option.value }"
        @click="handleSelect(option.value)"
      >
        <div class="period-option__icon">{{ option.icon }}</div>
        <div class="period-option__name">{{ option.label }}</div>
        <div class="period-option__desc">{{ option.description }}</div>
      </button>
    </div>
    
    <div v-if="modelValue === 'irregular'" class="irregular-settings">
      <h4 class="irregular-settings__title">自定义间隔</h4>
      <div class="irregular-settings__input">
        <label>输入间隔天数（用逗号分隔，如：30,45,60）：</label>
        <input
          v-model="customIntervals"
          type="text"
          placeholder="30,45,60"
          @change="handleCustomChange"
        />
      </div>
      <div class="irregular-settings__hint">
        <p>💡 提示：输入的间隔数量应与总期数匹配，或设置一个通用间隔</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'PeriodSelector',
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue', 'custom-schedule'],
  setup(props, { emit }) {
    const customIntervals = ref('')
    
    const periodOptions = [
      {
        value: 'monthly',
        label: '月度',
        icon: '📅',
        description: '每30天生成一次账单'
      },
      {
        value: 'quarterly',
        label: '季度',
        icon: '📊',
        description: '每3个月生成一次账单'
      },
      {
        value: 'yearly',
        label: '年度',
        icon: '📈',
        description: '每12个月生成一次账单'
      },
      {
        value: 'irregular',
        label: '不规则',
        icon: '🎯',
        description: '自定义账单间隔周期'
      }
    ]
    
    const handleSelect = (value) => {
      emit('update:modelValue', value)
    }
    
    const handleCustomChange = () => {
      if (customIntervals.value) {
        const intervals = customIntervals.value
          .split(',')
          .map(v => parseInt(v.trim()))
          .filter(v => !isNaN(v))
        
        if (intervals.length > 0) {
          emit('custom-schedule', intervals)
        }
      }
    }
    
    watch(() => props.modelValue, (newVal) => {
      if (newVal !== 'irregular') {
        customIntervals.value = ''
      }
    })
    
    return {
      periodOptions,
      customIntervals,
      handleSelect,
      handleCustomChange
    }
  }
}
</script>

<style scoped>
.period-selector {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.period-selector__title {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.period-selector__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.period-option {
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.period-option:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

.period-option--active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.period-option__icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.period-option__name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.period-option__desc {
  font-size: 12px;
  color: #6b7280;
}

.irregular-settings {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.irregular-settings__title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
}

.irregular-settings__input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.irregular-settings__input label {
  font-size: 14px;
  color: #374151;
}

.irregular-settings__input input {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.irregular-settings__input input:focus {
  outline: none;
  border-color: #3b82f6;
}

.irregular-settings__hint {
  margin-top: 12px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 13px;
  color: #0369a1;
}

.irregular-settings__hint p {
  margin: 0;
}
</style>
