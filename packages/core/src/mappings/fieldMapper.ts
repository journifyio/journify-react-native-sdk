import { JournifyEvent } from '../events';
import { FieldMapping, FieldMappingSourceType } from '../types';
import { GetValue, SetValue } from '../utils';

/**
 * Interface for field mapper constructors.
 * Defines the shape of classes that can be instantiated as field mappers.
 */
interface FieldMapperConstructor {
  new (mappings: FieldMapping[]): IFieldMapper;
}

/**
 * Interface defining the contract for field mappers.
 * Field mappers transform JournifyEvents based on mapping rules.
 */
export interface IFieldMapper {
  map: (event: JournifyEvent) => Record<string, any>;
}

/**
 * Factory function that creates a field mapper instance.
 * Allows for dependency injection of different mapper implementations.
 *
 * @param ctor - The constructor for the field mapper implementation
 * @param mappings - Array of field mappings to apply
 * @returns An instance of the specified field mapper
 */
export function createFieldMapper(
  ctor: FieldMapperConstructor,
  mappings: FieldMapping[]
): IFieldMapper {
  return new ctor(mappings);
}

/**
 * Default implementation of the field mapper interface.
 * Maps event fields according to provided field mappings.
 */
export class DefaultFieldMapper implements IFieldMapper {
  private readonly mappings: FieldMapping[];

  /**
   * Creates an instance of DefaultFieldMapper.
   *
   * @param mappings - Array of field mappings to apply during mapping
   */
  constructor(mappings: FieldMapping[]) {
    this.mappings = mappings;
  }

  /**
   * Maps a JournifyEvent according to the configured field mappings.
   * Only maps fields from mappings with source type FIELD.
   * Skips null or undefined values.
   *
   * @param event - The event to map
   * @returns Mapped properties object
   */
  map(event: JournifyEvent): Record<string, any> {
    if (!event || Object.keys(event).length === 0) {
      return {};
    }
    let mappedEvent: Record<string, any> = {};
    for (const mapping of this.mappings) {
      let value = null;
      if (mapping.source.type === FieldMappingSourceType.FIELD) {
        value = GetValue(event, mapping.source.value);
        if (value !== undefined && value !== null) {
          SetValue(mappedEvent, mapping.target.name, value);
        }
      }
    }
    return mappedEvent?.properties ?? {};
  }
}
