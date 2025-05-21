import { JournifyEvent } from '../events';
import { DestinationEventMapping, EventFilter, FilterOperator } from './types';
import { EventMapping } from '../types';
import { GetValue } from '../utils';

/**
 * Interface defining the contract for event mappers.
 * Event mappers determine if and how JournifyEvents should be mapped to destination events.
 */
export interface IEventMapper {
  /**
   * Maps a JournifyEvent to a destination event mapping based on mapping rules and filters.
   *
   * @param event - The event to map
   * @returns The destination event mapping if the event matches filters, or null if no match
   */
  map(event: JournifyEvent): DestinationEventMapping | null;
}

/**
 * Interface for event mapper constructors.
 * Defines the shape of classes that can be instantiated as event mappers.
 */
interface EventMapperConstructor {
  new (mappings: EventMapping[]): IEventMapper;
}

/**
 * Factory function that creates an event mapper instance.
 * Allows for dependency injection of different mapper implementations.
 *
 * @param ctor - The constructor for the event mapper implementation
 * @param mappings - Array of event mappings to apply
 * @returns An instance of the specified event mapper
 */
export function createEventMapper(
  ctor: EventMapperConstructor,
  mappings: EventMapping[]
): IEventMapper {
  return new ctor(mappings);
}

/**
 * Default implementation of the event mapper interface.
 * Maps events to destination event mappings according to provided mappings and filters.
 */
export class DefaultEventMapper implements IEventMapper {
  private readonly mappings: EventMapping[];

  /**
   * Creates an instance of DefaultEventMapper.
   *
   * @param mappings - Array of event mappings to apply during mapping
   */
  constructor(mappings: EventMapping[]) {
    this.mappings = mappings;
  }

  /**
   * Maps a JournifyEvent to a destination event mapping based on mapping rules and filters.
   * The method first checks if the event name matches a source event mapping, then
   * evaluates all filters to determine the appropriate destination mapping.
   *
   * @param event - The event to map
   * @returns The destination event mapping if the event matches filters, or null if no match
   */
  map(event: JournifyEvent): DestinationEventMapping | null {
    if (!event || Object.keys(event).length === 0 || !event.event) {
      return null;
    }
    // Return early if there are no mappings
    if (this.mappings.length === 0) {
      return { dstEventName: event.event, filters: [] };
    }
    // Find matching source event mapping
    const eventMapping = this.mappings.find(
      (mapping) => mapping.event_name === event.event
    );
    if (
      !eventMapping ||
      !eventMapping.enabled ||
      !eventMapping.destination_event_key
    ) {
      console.log(`No matching event mapping found for event: ${event.event}`);
      return null;
    }
    const dstEventMapping = {
      dstEventName: eventMapping.destination_event_key,
      filters: eventMapping.filters || [],
    };
    // If there are no filters, or all filters match, return the destination mapping
    if (
      dstEventMapping.filters &&
      !this.matchesAllFilters(event, dstEventMapping.filters)
    ) {
      console.log(`Event does not match all filters for event: ${event.event}`);
      return null;
    }

    return dstEventMapping;
  }

  /**
   * Checks if an event matches all the provided filters.
   *
   * @param event - The event to check against filters
   * @param filters - Array of filters to apply
   * @returns True if the event matches all filters, false otherwise
   */
  private matchesAllFilters(
    event: JournifyEvent,
    filters: EventFilter[]
  ): boolean {
    return filters.every((filter) => this.matchesFilter(event, filter));
  }

  /**
   * Checks if an event matches a single filter condition.
   *
   * @param event - The event to check
   * @param filter - The filter to apply
   * @returns True if the event matches the filter, false otherwise
   */
  private matchesFilter(event: JournifyEvent, filter: EventFilter): boolean {
    const fieldValue = GetValue(event, filter.field);

    // If the field doesn't exist, the filter doesn't match
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    const filterValue = filter.value;
    const stringFieldValue = String(fieldValue);
    const stringFilterValue = String(filterValue);

    switch (filter.operator) {
      case FilterOperator.EQUALS:
        return fieldValue === filterValue;

      case FilterOperator.NOT_EQUALS:
        return fieldValue !== filterValue;

      case FilterOperator.CONTAINS:
        return stringFieldValue.includes(stringFilterValue);

      case FilterOperator.NOT_CONTAINS:
        return !stringFieldValue.includes(stringFilterValue);

      case FilterOperator.STARTS_WITH:
        return stringFieldValue.startsWith(stringFilterValue);

      case FilterOperator.ENDS_WITH:
        return stringFieldValue.endsWith(stringFilterValue);

      case FilterOperator.GREATER_THAN:
        return typeof fieldValue === 'number' && typeof filterValue === 'number'
          ? fieldValue > filterValue
          : stringFieldValue > stringFilterValue;

      case FilterOperator.GREATER_THAN_OR_EQ:
        return typeof fieldValue === 'number' && typeof filterValue === 'number'
          ? fieldValue >= filterValue
          : stringFieldValue >= stringFilterValue;

      case FilterOperator.LESS_THAN:
        return typeof fieldValue === 'number' && typeof filterValue === 'number'
          ? fieldValue < filterValue
          : stringFieldValue < stringFilterValue;

      case FilterOperator.LESS_THAN_OR_EQ:
        return typeof fieldValue === 'number' && typeof filterValue === 'number'
          ? fieldValue <= filterValue
          : stringFieldValue <= stringFilterValue;

      default:
        console.warn(`Unhandled filter operator: ${filter.operator}`);
        return false;
    }
  }
}
