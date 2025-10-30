import type { Schema, Struct } from '@strapi/strapi';

export interface UnitTypesIndustrial extends Struct.ComponentSchema {
  collectionName: 'components_units_industrials';
  info: {
    description: 'Industrial unit details (land, warehouse, mezzanine, dimensions, utilities)';
    displayName: 'Industrial';
  };
  attributes: {
    ceilingHeight: Schema.Attribute.Decimal;
    dimensions: Schema.Attribute.JSON;
    fireSuppression: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    land: Schema.Attribute.JSON;
    loadingDock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    loadingDockCount: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    mezzanine: Schema.Attribute.JSON;
    officeSpace: Schema.Attribute.Decimal;
    powerCapacity: Schema.Attribute.Decimal;
    powerUnit: Schema.Attribute.Enumeration<['kW', 'kVA', 'HP']> &
      Schema.Attribute.DefaultTo<'kW'>;
    railAccess: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    securitySystem: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    sewageSystem: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    storageCapacity: Schema.Attribute.Decimal;
    truckAccess: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    warehouse: Schema.Attribute.JSON;
    waterSupply: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    zoning: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
  };
}

export interface UnitTypesOffice extends Struct.ComponentSchema {
  collectionName: 'components_units_offices';
  info: {
    description: 'Office unit details (class, layout, amenities)';
    displayName: 'Office';
  };
  attributes: {
    airConditioning: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    class: Schema.Attribute.Enumeration<
      ['A', 'B', 'C', 'premium', 'standard', 'basic']
    > &
      Schema.Attribute.Required;
    elevatorAccess: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    employees: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    floor: Schema.Attribute.Integer;
    kitchenette: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    legends: Schema.Attribute.JSON;
    meetingRooms: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    openSpace: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    privateOffices: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    receptionArea: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    storageRoom: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    view: Schema.Attribute.Enumeration<
      ['city', 'park', 'street', 'courtyard', 'none']
    >;
  };
}

export interface UnitTypesResidential extends Struct.ComponentSchema {
  collectionName: 'components_units_residentials';
  info: {
    description: 'Residential unit details (rooms, features, flags)';
    displayName: 'Residential';
  };
  attributes: {
    balcony: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    bathrooms: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    bedrooms: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    floor: Schema.Attribute.Integer;
    furnished: Schema.Attribute.Enumeration<
      ['unfurnished', 'semi-furnished', 'fully-furnished']
    > &
      Schema.Attribute.DefaultTo<'unfurnished'>;
    garden: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    orientation: Schema.Attribute.Enumeration<
      [
        'north',
        'south',
        'east',
        'west',
        'northeast',
        'northwest',
        'southeast',
        'southwest',
      ]
    >;
    parkingSpaces: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    petFriendly: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    smokingAllowed: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    terrace: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'unit-types.industrial': UnitTypesIndustrial;
      'unit-types.office': UnitTypesOffice;
      'unit-types.residential': UnitTypesResidential;
    }
  }
}
