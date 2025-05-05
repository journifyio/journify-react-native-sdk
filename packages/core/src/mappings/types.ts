/**
 * Defines a field mapping between a source and target.
 * Used to transform data from one structure to another.
 */
export interface FieldMapping {
  source: FieldMappingSource;
  target: FieldMappingTarget;
}

/**
 * Specifies the source configuration for a field mapping.
 * Contains the type of mapping and the value to be used.
 */
export interface FieldMappingSource {
  type: FieldMappingSourceType;
  value: string;
}

/**
 * Enumerates the different types of source mappings.
 * Each type represents a different strategy for obtaining field values.
 */
export enum FieldMappingSourceType {
  /** Default unspecified type */
  UNSPECIFIED = 0,
  /** Maps directly from a field in the source object */
  FIELD = 1,
  /** Uses a template string with variable substitution */
  TEMPLATE = 2,
  /** Uses a fixed constant value */
  CONSTANT = 3,
  /** References a variable from the context */
  VARIABLE = 4,
}

/**
 * Defines the target destination for a field mapping.
 * Specifies where the mapped value should be placed.
 */
export interface FieldMappingTarget {
  name: string;
}

/**
 * Represents a filter condition for events.
 * Used to determine if an event matches specific criteria.
 */
export interface EventFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Defines the available comparison operators for filtering.
 * Used to compare field values against filter values.
 */
export enum FilterOperator {
  /** Default empty operator */
  UNSPECIFIED = '',
  /** Checks if values are equal */
  EQUALS = '==',
  /** Checks if values are not equal */
  NOT_EQUALS = '!=',
  /** Checks if the value contains the specified substring */
  CONTAINS = 'contains',
  /** Checks if the value does not contain the specified substring */
  NOT_CONTAINS = 'not contains',
  /** Checks if the value starts with the specified substring */
  STARTS_WITH = 'starts-with',
  /** Checks if the value ends with the specified substring */
  ENDS_WITH = 'ends-with',
  /** Checks if the value is greater than the specified value */
  GREATER_THAN = '>',
  /** Checks if the value is greater than or equal to the specified value */
  GREATER_THAN_OR_EQ = '>=',
  /** Checks if the value is less than the specified value */
  LESS_THAN = '<',
  /** Checks if the value is less than or equal to the specified value */
  LESS_THAN_OR_EQ = '<=',
}
