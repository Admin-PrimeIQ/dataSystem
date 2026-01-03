import type { Schema, Struct } from '@strapi/strapi';

export interface UnitTypesHousing extends Struct.ComponentSchema {
  collectionName: 'components_unit_types_housings';
  info: {
    description: 'Housing-specific unit information (apartments, houses, townhouses)';
    displayName: 'Housing';
    icon: 'house';
    name: 'Housing';
  };
  attributes: {
    balconyTerraceSize: Schema.Attribute.Decimal;
    balconyTerraceSizeV2: Schema.Attribute.Decimal;
    bedrooms: Schema.Attribute.Integer;
  };
}

export interface UnitTypesIndustrial extends Struct.ComponentSchema {
  collectionName: 'components_unit_types_industrials';
  info: {
    description: 'Industrial warehouse-specific unit information (warehouses, storage facilities)';
    displayName: 'Industrial';
    icon: 'store';
    name: 'Industrial';
  };
  attributes: {
    additionalParkingPriceUSD: Schema.Attribute.Decimal;
    depth1M2: Schema.Attribute.Decimal;
    depth1V2: Schema.Attribute.Decimal;
    depth2M2: Schema.Attribute.Decimal;
    depth2V2: Schema.Attribute.Decimal;
    heightM2: Schema.Attribute.Decimal;
    heightV2: Schema.Attribute.Decimal;
    loadingAreaM2: Schema.Attribute.Decimal;
    loadingAreaV2: Schema.Attribute.Decimal;
    mezzanineSizeM2: Schema.Attribute.Decimal;
    mezzanineSizeV2: Schema.Attribute.Decimal;
    officeSizeM2: Schema.Attribute.Decimal;
    officeSizeV2: Schema.Attribute.Decimal;
    warehouseStorageSizeM2: Schema.Attribute.Decimal;
    warehouseStorageSizeV2: Schema.Attribute.Decimal;
    width1M2: Schema.Attribute.Decimal;
    width1V2: Schema.Attribute.Decimal;
  };
}

export interface UnitTypesOffices extends Struct.ComponentSchema {
  collectionName: 'components_unit_types_offices';
  info: {
    description: 'Office-specific unit information (office spaces, commercial offices)';
    displayName: 'Office';
    icon: 'briefcase';
    name: 'Offices';
  };
  attributes: {
    balconyTerraceSize: Schema.Attribute.Decimal;
    balconyTerraceSizeV2: Schema.Attribute.Decimal;
    employeeCapacity: Schema.Attribute.Integer;
    employeeCapacityRange: Schema.Attribute.Enumeration<
      [
        'Range_1_To_5',
        'Range_6_To_10',
        'Range_11_To_15',
        'Range_16_To_20',
        'Range_21_To_30',
        'Range_31_To_40',
        'Range_41_To_50',
        'Range_51_To_80',
        'Range_81_To_100',
        'Range_101_To_140',
        'Range_141_To_170',
        'Range_More_Than_171',
      ]
    >;
    generalSizeClassification: Schema.Attribute.Enumeration<
      ['Micro', 'Small', 'Medium', 'Large']
    >;
    m2Range: Schema.Attribute.String;
    officeClassification: Schema.Attribute.Enumeration<
      [
        'Micro 1',
        'Micro 2',
        'Small 1',
        'Small 2',
        'Medium 1',
        'Medium 2',
        'Medium 3',
        'Large 1',
        'Large 2',
        'Large 3',
        'Large 4',
        'Large 5',
      ]
    >;
    parkingForSale: Schema.Attribute.Integer;
    priceWithoutParkingM2USD: Schema.Attribute.Decimal;
    propertyValueWithoutParkingUSD: Schema.Attribute.Decimal;
    sizeEmployeeCapacityCombined: Schema.Attribute.String;
    sizeM2Combined: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'unit-types.housing': UnitTypesHousing;
      'unit-types.industrial': UnitTypesIndustrial;
      'unit-types.offices': UnitTypesOffices;
    }
  }
}
