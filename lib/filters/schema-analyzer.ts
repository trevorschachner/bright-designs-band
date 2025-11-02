import { FilterField, FieldType, FilterOperator, TableSchema } from './types';

/**
 * Analyzes database schema to automatically generate filterable fields
 */
export class SchemaAnalyzer {
  private static getFieldType(sqlType: string): FieldType {
    const type = sqlType.toLowerCase();
    
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
      return 'text';
    }
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float')) {
      return 'number';
    }
    if (type.includes('timestamp') || type.includes('date') || type.includes('time')) {
      return 'date';
    }
    if (type.includes('boolean') || type.includes('bool')) {
      return 'boolean';
    }
    if (type.includes('enum')) {
      return 'enum';
    }
    if (type.includes('array') || type.includes('[]')) {
      return 'array';
    }
    
    return 'text'; // fallback
  }

  private static getOperatorsForType(type: FieldType): FilterOperator[] {
    switch (type) {
      case 'text':
        return ['equals', 'contains', 'startsWith', 'endsWith', 'in', 'notIn', 'isNull', 'isNotNull'];
      case 'number':
        return ['equals', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'];
      case 'date':
        return ['equals', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'];
      case 'boolean':
        return ['equals', 'isNull', 'isNotNull'];
      case 'enum':
        return ['equals', 'in', 'notIn', 'isNull', 'isNotNull'];
      case 'array':
        return ['contains', 'in', 'notIn', 'isNull', 'isNotNull'];
      case 'relation':
        return ['equals', 'in', 'notIn', 'isNull', 'isNotNull'];
      default:
        return ['equals', 'isNull', 'isNotNull'];
    }
  }

  private static formatFieldLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  /**
   * Generate filter fields from a table schema definition
   */
  static generateFilterFields(schema: TableSchema, excludeFields: string[] = []): FilterField[] {
    const fields: FilterField[] = [];
    
    Object.entries(schema.fields).forEach(([key, field]) => {
      if (excludeFields.includes(key)) return;
      
      const fieldType = this.getFieldType(field.type);
      
      const filterField: FilterField = {
        key,
        label: this.formatFieldLabel(key),
        type: fieldType,
        operators: this.getOperatorsForType(fieldType),
        placeholder: `Filter by ${this.formatFieldLabel(key).toLowerCase()}...`
      };

      // Add enum values if applicable
      if (fieldType === 'enum' && field.enumValues) {
        filterField.enumValues = field.enumValues;
      }

      // Add min/max for number fields (could be enhanced with actual DB constraints)
      if (fieldType === 'number') {
        filterField.min = 0;
        if (key.toLowerCase().includes('price')) {
          filterField.max = 10000;
        } else if (key.toLowerCase().includes('year')) {
          filterField.min = 1900;
          filterField.max = new Date().getFullYear() + 10;
        }
      }

      fields.push(filterField);
    });

    // Add relation fields
    Object.entries(schema.relations).forEach(([key, relation]) => {
      if (excludeFields.includes(key)) return;
      
      fields.push({
        key,
        label: this.formatFieldLabel(key),
        type: 'relation',
        operators: this.getOperatorsForType('relation'),
        placeholder: `Filter by ${this.formatFieldLabel(key).toLowerCase()}...`
      });
    });

    return fields;
  }
}

// Pre-defined schema configurations for our tables
export const SHOWS_SCHEMA: TableSchema = {
  name: 'shows',
  fields: {
    id: { key: 'id', type: 'serial' },
    title: { key: 'title', type: 'text' },
    year: { key: 'year', type: 'text' },
    difficulty: { key: 'difficulty', type: 'enum', enumValues: ['Beginner', 'Intermediate', 'Advanced'] },
    duration: { key: 'duration', type: 'text' },
    description: { key: 'description', type: 'text', nullable: true },
    thumbnailUrl: { key: 'thumbnailUrl', type: 'text', nullable: true },
    createdAt: { key: 'createdAt', type: 'timestamp' },
    // virtual field used by UI; handled specially in API
    ensembleSize: { key: 'ensembleSize', type: 'enum', enumValues: ['small','medium','large'] }
  },
  relations: {
    tags: {
      type: 'many',
      table: 'tags',
      fields: ['showsToTags', 'tag', 'name']
    },
    arrangements: {
      type: 'many', 
      table: 'arrangements',
      fields: ['title', 'type']
    }
  }
};

export const ARRANGEMENTS_SCHEMA: TableSchema = {
  name: 'arrangements',
  fields: {
    id: { key: 'id', type: 'serial' },
    title: { key: 'title', type: 'text' },
    type: { key: 'type', type: 'text', nullable: true },
    price: { key: 'price', type: 'numeric' },
    showId: { key: 'showId', type: 'integer' }
  },
  relations: {
    show: {
      type: 'one',
      table: 'shows', 
      fields: ['title', 'year', 'difficulty']
    }
  }
};

// Generate filter fields for our tables
export const SHOWS_FILTER_FIELDS = SchemaAnalyzer.generateFilterFields(
  SHOWS_SCHEMA, 
  ['id', 'thumbnailUrl', 'description', 'duration', 'createdAt'] // keep UI lean; virtual ensembleSize remains
);

export const ARRANGEMENTS_FILTER_FIELDS = SchemaAnalyzer.generateFilterFields(
  ARRANGEMENTS_SCHEMA,
  ['id', 'showId'] // Exclude technical fields
);