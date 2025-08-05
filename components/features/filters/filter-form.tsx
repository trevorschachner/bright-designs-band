'use client';

import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FilterState, 
  FilterField, 
  FilterCondition, 
  FilterOperator 
} from '@/lib/filters/types';

interface FilterFormProps {
  filterState: FilterState;
  onFilterStateChange: (state: FilterState) => void;
  filterFields: FilterField[];
  onClose?: () => void;
}

interface FormCondition extends FilterCondition {
  id: string;
}

export function FilterForm({
  filterState,
  onFilterStateChange,
  filterFields,
  onClose
}: FilterFormProps) {
  // Convert conditions to form conditions with IDs
  const [formConditions, setFormConditions] = useState<FormCondition[]>(
    filterState.conditions.map((condition, index) => ({
      ...condition,
      id: `condition-${index}`
    }))
  );

  const addCondition = () => {
    const newCondition: FormCondition = {
      id: `condition-${Date.now()}`,
      field: filterFields[0]?.key || '',
      operator: 'equals',
      value: ''
    };
    setFormConditions([...formConditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setFormConditions(formConditions.filter(condition => condition.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FormCondition>) => {
    setFormConditions(formConditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  const getOperatorLabel = (operator: FilterOperator): string => {
    const labels: Record<FilterOperator, string> = {
      equals: 'equals',
      contains: 'contains',
      startsWith: 'starts with',
      endsWith: 'ends with',
      gt: 'greater than',
      gte: 'greater than or equal',
      lt: 'less than',
      lte: 'less than or equal',
      in: 'is one of',
      notIn: 'is not one of',
      between: 'is between',
      isNull: 'is empty',
      isNotNull: 'is not empty'
    };
    return labels[operator] || operator;
  };

  const renderValueInput = (condition: FormCondition, field: FilterField) => {
    const updateValue = (value: any) => {
      updateCondition(condition.id, { value });
    };

    const updateValues = (values: any[]) => {
      updateCondition(condition.id, { values, value: undefined });
    };

    // No input needed for these operators
    if (['isNull', 'isNotNull'].includes(condition.operator)) {
      return null;
    }

    // Multiple values input
    if (['in', 'notIn'].includes(condition.operator)) {
      return (
        <div className="space-y-2">
          <Label>Values (comma-separated)</Label>
          <Input
            placeholder="Value 1, Value 2, Value 3..."
            value={condition.values?.join(', ') || ''}
            onChange={(e) => {
              const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
              updateValues(values);
            }}
          />
        </div>
      );
    }

    // Between operator needs two values
    if (condition.operator === 'between') {
      const values = condition.values || ['', ''];
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>From</Label>
            <Input
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              value={values[0] || ''}
              onChange={(e) => updateValues([e.target.value, values[1] || ''])}
              min={field.min}
              max={field.max}
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              value={values[1] || ''}
              onChange={(e) => updateValues([values[0] || '', e.target.value])}
              min={field.min}
              max={field.max}
            />
          </div>
        </div>
      );
    }

    // Enum field with select
    if (field.type === 'enum' && field.enumValues) {
      return (
        <div>
          <Label>Value</Label>
          <Select value={condition.value || ''} onValueChange={updateValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select a value..." />
            </SelectTrigger>
            <SelectContent>
              {field.enumValues.map(value => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Boolean field
    if (field.type === 'boolean') {
      return (
        <div>
          <Label>Value</Label>
          <Select value={condition.value?.toString() || ''} onValueChange={(value) => updateValue(value === 'true')}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Default input
    return (
      <div>
        <Label>Value</Label>
        <Input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          placeholder={field.placeholder || 'Enter value...'}
          value={condition.value || ''}
          onChange={(e) => updateValue(e.target.value)}
          min={field.min}
          max={field.max}
        />
      </div>
    );
  };

  const applyFilters = () => {
    // Convert form conditions back to regular conditions
    const conditions: FilterCondition[] = formConditions.map(({ id, ...condition }) => condition);
    
    onFilterStateChange({
      ...filterState,
      conditions,
      page: 1 // Reset to first page when applying filters
    });

    if (onClose) {
      onClose();
    }
  };

  const clearAllFilters = () => {
    setFormConditions([]);
  };

  return (
    <div className="space-y-6">
      {/* Filter Conditions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Filter Conditions</h3>
          {formConditions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>

        {formConditions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No filters applied.</p>
            <p className="text-sm">Add a condition to start filtering.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formConditions.map((condition, index) => {
              const field = filterFields.find(f => f.key === condition.field);
              if (!field) return null;

              return (
                <div key={condition.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Condition {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Field Selection */}
                    <div>
                      <Label>Field</Label>
                      <Select 
                        value={condition.field} 
                        onValueChange={(value) => updateCondition(condition.id, { 
                          field: value, 
                          operator: 'equals', 
                          value: '', 
                          values: undefined 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterFields.map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator Selection */}
                    <div>
                      <Label>Operator</Label>
                      <Select 
                        value={condition.operator} 
                        onValueChange={(value) => updateCondition(condition.id, { 
                          operator: value as FilterOperator, 
                          value: '', 
                          values: undefined 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.operators.map(operator => (
                            <SelectItem key={operator} value={operator}>
                              {getOperatorLabel(operator)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Value Input */}
                  {renderValueInput(condition, field)}
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" onClick={addCondition} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Condition
        </Button>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={applyFilters} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}