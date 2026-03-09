import { useState } from "react";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/lib/types";
import {
  AdvancedFilter, FilterCondition, FilterLogic, FilterOperator,
  OPERATOR_LABELS, OPERATORS_BY_TYPE, createEmptyCondition, createEmptyFilter,
} from "@/lib/filter-types";

interface AdvancedFilterBuilderProps {
  fields: Field[];
  filter: AdvancedFilter;
  onChange: (filter: AdvancedFilter) => void;
  onSaveAsView?: () => void;
  onClear: () => void;
}

export function AdvancedFilterBuilder({ fields, filter, onChange, onSaveAsView, onClear }: AdvancedFilterBuilderProps) {
  const addCondition = () => {
    const cond = createEmptyCondition();
    if (fields.length > 0) cond.fieldKey = fields[0].fieldKey;
    onChange({ ...filter, conditions: [...filter.conditions, cond] });
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange({
      ...filter,
      conditions: filter.conditions.map((c) => c.id === id ? { ...c, ...updates } : c),
    });
  };

  const removeCondition = (id: string) => {
    onChange({ ...filter, conditions: filter.conditions.filter((c) => c.id !== id) });
  };

  const toggleLogic = () => {
    onChange({ ...filter, logic: filter.logic === 'and' ? 'or' : 'and' });
  };

  const getOperators = (fieldKey: string): FilterOperator[] => {
    const field = fields.find((f) => f.fieldKey === fieldKey);
    return OPERATORS_BY_TYPE[field?.fieldType || 'default'] || OPERATORS_BY_TYPE.default;
  };

  const needsValue = (op: FilterOperator) => op !== 'is_empty' && op !== 'is_not_empty';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-border bg-card shadow-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filters</span>
          {filter.conditions.length > 1 && (
            <button
              onClick={toggleLogic}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            >
              {filter.logic.toUpperCase()}
            </button>
          )}
          {filter.conditions.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {filter.conditions.length} rule{filter.conditions.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onSaveAsView && filter.conditions.length > 0 && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onSaveAsView}>
              <Save className="h-3 w-3 mr-1" /> Save as View
            </Button>
          )}
          {filter.conditions.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onClear}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear All
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filter.conditions.map((cond, idx) => {
          const operators = getOperators(cond.fieldKey);
          const field = fields.find((f) => f.fieldKey === cond.fieldKey);
          const showValue = needsValue(cond.operator);

          return (
            <motion.div
              key={cond.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="flex items-center gap-2 flex-wrap"
            >
              {idx > 0 && (
                <span className="text-[10px] font-bold text-primary w-8 text-center uppercase">
                  {filter.logic}
                </span>
              )}
              {idx === 0 && filter.conditions.length > 1 && <span className="w-8" />}

              {/* Field selector */}
              <Select value={cond.fieldKey} onValueChange={(v) => updateCondition(cond.id, { fieldKey: v, value: '', valueTo: undefined })}>
                <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Field..." /></SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.fieldKey}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator selector */}
              <Select value={cond.operator} onValueChange={(v) => updateCondition(cond.id, { operator: v as FilterOperator, valueTo: undefined })}>
                <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value input */}
              {showValue && field?.fieldType === 'select' ? (
                <Select value={cond.value} onValueChange={(v) => updateCondition(cond.id, { value: v })}>
                  <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Value..." /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : showValue && (
                <Input
                  type={field?.fieldType === 'number' || field?.fieldType === 'currency' ? 'number' : field?.fieldType === 'date' ? 'date' : 'text'}
                  value={cond.value}
                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                  placeholder="Value..."
                  className="h-8 text-xs w-[130px]"
                />
              )}

              {/* Between second value */}
              {cond.operator === 'between' && (
                <>
                  <span className="text-xs text-muted-foreground">and</span>
                  <Input
                    type={field?.fieldType === 'number' || field?.fieldType === 'currency' ? 'number' : field?.fieldType === 'date' ? 'date' : 'text'}
                    value={cond.valueTo || ''}
                    onChange={(e) => updateCondition(cond.id, { valueTo: e.target.value })}
                    placeholder="To..."
                    className="h-8 text-xs w-[110px]"
                  />
                </>
              )}

              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeCondition(cond.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addCondition}>
        <Plus className="h-3 w-3 mr-1.5" /> Add Condition
      </Button>
    </motion.div>
  );
}
