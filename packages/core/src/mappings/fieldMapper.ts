import { JournifyEvent } from '../events';
import { FieldMapping, FieldMappingSourceType } from '../types';
import {
  GetValue,
  SetValue,
  GetCurrentUtcDate,
  GetCurrentUtcTime,
} from '../utils';
import { Liquid, Template } from 'liquidjs';
import * as uuid from 'uuid';

const CURRENT_DATE_VAR_NAME = 'CURRENT_DATE';
const CURRENT_TIME_VAR_NAME = 'CURRENT_TIME';
const UUID_VAR_NAME = 'UUID';
const EVENT_TEMPLATING_KEY = 'record';
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
  private readonly liquidEngine: Liquid;
  private readonly templateCache: Record<string, Template[]>;

  /**
   * Creates an instance of DefaultFieldMapper.
   *
   * @param mappings - Array of field mappings to apply during mapping
   */
  constructor(mappings: FieldMapping[]) {
    this.mappings = mappings;
    this.liquidEngine = new Liquid();

    this.templateCache = {};
    for (const mapping of this.mappings) {
      if (mapping.source.type === FieldMappingSourceType.TEMPLATE) {
        const tpl = this.liquidEngine.parse(mapping.source.value);
        this.templateCache[mapping.target.name] = tpl;
      }
    }
  }

  /**
   * Maps a JournifyEvent according to the configured field mappings.
   *
   * This method iterates over the field mappings and applies transformations
   * based on the source type. Supported source types include:
   * - FIELD: Extracts a value from the event using the source value as a key.
   * - TEMPLATE: Renders a template using the event data.
   * - CONSTANT: Uses a constant value defined in the mapping.
   * - VARIABLE: Maps a variable value using predefined logic.
   *
   * If a template is not found in the cache, a warning is logged, and the mapping is skipped.
   *
   * @param event - The event to map.
   * @returns A mapped properties object containing the transformed data.
   */
  map(event: JournifyEvent): Record<string, any> {
    if (!event || Object.keys(event).length === 0) {
      return {};
    }
    let mappedEvent: Record<string, any> = {};
    for (const mapping of this.mappings) {
      let value = null;
      switch (mapping.source.type) {
        case FieldMappingSourceType.FIELD:
          value = GetValue(event, mapping.source.value);
          if (value !== undefined && value !== null) {
            SetValue(mappedEvent, mapping.target.name, value);
          }
          break;
        case FieldMappingSourceType.TEMPLATE:
          if (!this.templateCache[mapping.target.name]) {
            console.warn(
              `Template not found for target: ${mapping.target.name}`
            );
            continue;
          }
          value = this.liquidEngine.renderSync(
            this.templateCache[mapping.target.name],
            {
              [EVENT_TEMPLATING_KEY]: event,
            }
          );
          break;
        case FieldMappingSourceType.CONSTANT:
          value = mapping.source.value;
          break;
        case FieldMappingSourceType.VARIABLE:
          value = this.mapVariableValue(mapping);
          break;
      }
    }
    return mappedEvent?.properties ?? {};
  }

  /**
   * Maps a variable value based on the source value in the mapping.
   *
   * Supported variable values include:
   * - CURRENT_DATE: Returns the current UTC date.
   * - CURRENT_TIME: Returns the current UTC time.
   * - UUID: Generates a new UUID.
   *
   * If the source value is unhandled, a warning is logged, and an empty string is returned.
   *
   * @param mapping - The field mapping containing the source value.
   * @returns The mapped variable value as a string.
   */
  private mapVariableValue(mapping: FieldMapping): string {
    switch (mapping.source.value) {
      case CURRENT_DATE_VAR_NAME:
        return GetCurrentUtcDate();

      case CURRENT_TIME_VAR_NAME:
        return GetCurrentUtcTime();

      case UUID_VAR_NAME:
        return uuid.v4();

      default:
        console.warn(`Unhandled variable value: ${mapping.source.value}`);
        return '';
    }
  }
}
