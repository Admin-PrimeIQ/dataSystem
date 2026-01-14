import type { Schema, Struct } from '@strapi/strapi';

export interface CurrenciesCurrencies extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currencies';
  info: {
    description: 'Currency configuration for the project. USD (US Dollar) is the BASE CURRENCY - all prices are stored in USD. Add alternative currencies with their buy/sell exchange rates relative to USD.';
    displayName: 'Currencies Configuration';
    icon: 'coins';
    name: 'Currencies';
  };
  options: {
    timestamps: false;
  };
  attributes: {
    bzd: Schema.Attribute.Component<'currencies.currency-belize', false>;
    crc: Schema.Attribute.Component<
      'currencies.currency-colon-costarricense',
      false
    >;
    gtq: Schema.Attribute.Component<'currencies.currency-quetzal', false>;
    hnl: Schema.Attribute.Component<'currencies.currency-lempira', false>;
    mxn: Schema.Attribute.Component<'currencies.currency-peso-mexicano', false>;
    nio: Schema.Attribute.Component<'currencies.currency-cordoba', false>;
    pab: Schema.Attribute.Component<'currencies.currency-balboa', false>;
    svc: Schema.Attribute.Component<
      'currencies.currency-colon-salvadoreno',
      false
    >;
    usd: Schema.Attribute.Component<'currencies.currency-dollar', false>;
  };
}

export interface CurrenciesCurrencyBalboa extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_balboas';
  info: {
    description: 'Panamanian Balboa (PAB) exchange rates relative to USD (base currency). Note: PAB is pegged 1:1 with USD.';
    displayName: 'Panamanian Balboa (PAB)';
    icon: 'dollar-sign';
    name: 'Currency Balboa';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
  };
}

export interface CurrenciesCurrencyBelize extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_belizes';
  info: {
    description: 'Belize Dollar (BZD) exchange rates relative to USD (base currency). BZD is pegged 2:1 with USD.';
    displayName: 'Belize Dollar (BZD)';
    icon: 'dollar-sign';
    name: 'Currency Belize';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<2>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<2>;
  };
}

export interface CurrenciesCurrencyColonCostarricense
  extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_colon_costarricenses';
  info: {
    description: 'Costa Rican Colon (CRC) exchange rates relative to USD (base currency)';
    displayName: 'Costa Rican Colon (CRC)';
    icon: 'dollar-sign';
    name: 'Currency Colon Costarricense';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<520>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<515>;
  };
}

export interface CurrenciesCurrencyColonSalvadoreno
  extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_colon_salvadorenos';
  info: {
    description: 'El Salvador uses USD (US Dollar) as its official currency. Rates are 1:1 with USD.';
    displayName: 'El Salvador (USD)';
    icon: 'dollar-sign';
    name: 'Currency Colon Salvadoreno';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 1;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    sellRate: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 1;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface CurrenciesCurrencyCordoba extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_cordobas';
  info: {
    description: 'Nicaraguan Cordoba (NIO) exchange rates relative to USD (base currency)';
    displayName: 'Nicaraguan Cordoba (NIO)';
    icon: 'dollar-sign';
    name: 'Currency Cordoba';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<36.5>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<36.45>;
  };
}

export interface CurrenciesCurrencyDollar extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_dollars';
  info: {
    description: 'US Dollar (USD) - Base currency. All prices are stored in USD.';
    displayName: 'US Dollar (USD)';
    icon: 'dollar-sign';
    name: 'Currency Dollar';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 1;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    sellRate: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 1;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface CurrenciesCurrencyLempira extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_lempiras';
  info: {
    description: 'Honduran Lempira (HNL) exchange rates relative to USD (base currency)';
    displayName: 'Honduran Lempira (HNL)';
    icon: 'dollar-sign';
    name: 'Currency Lempira';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<24.5>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<24.45>;
  };
}

export interface CurrenciesCurrencyPesoMexicano extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_peso_mexicanos';
  info: {
    description: 'Mexican Peso (MXN) exchange rates relative to USD (base currency)';
    displayName: 'Mexican Peso (MXN)';
    icon: 'dollar-sign';
    name: 'Currency Peso Mexicano';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<18.5>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<18.45>;
  };
}

export interface CurrenciesCurrencyQuetzal extends Struct.ComponentSchema {
  collectionName: 'components_currencies_currency_quetzals';
  info: {
    description: 'Guatemalan Quetzal (GTQ) exchange rates relative to USD (base currency)';
    displayName: 'Guatemalan Quetzal (GTQ)';
    icon: 'dollar-sign';
    name: 'Currency Quetzal';
  };
  attributes: {
    buyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<7.85>;
    sellRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<7.8>;
  };
}

export interface UnitTypesHousing extends Struct.ComponentSchema {
  collectionName: 'components_unit_types_housings';
  info: {
    description: 'Housing-specific unit information (apartments, houses, townhouses)';
    displayName: 'Housing';
    icon: 'house';
    name: 'Housing';
  };
  attributes: {
    balconyTerraceSizeM2: Schema.Attribute.Decimal;
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
    depth2M2: Schema.Attribute.Decimal;
    heightM2: Schema.Attribute.Decimal;
    loadingAreaM2: Schema.Attribute.Decimal;
    mezzanineSizeM2: Schema.Attribute.Decimal;
    officeSizeM2: Schema.Attribute.Decimal;
    warehouseStorageSizeM2: Schema.Attribute.Decimal;
    width1M2: Schema.Attribute.Decimal;
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
    balconyTerraceSizeM2: Schema.Attribute.Decimal;
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
      'currencies.currencies': CurrenciesCurrencies;
      'currencies.currency-balboa': CurrenciesCurrencyBalboa;
      'currencies.currency-belize': CurrenciesCurrencyBelize;
      'currencies.currency-colon-costarricense': CurrenciesCurrencyColonCostarricense;
      'currencies.currency-colon-salvadoreno': CurrenciesCurrencyColonSalvadoreno;
      'currencies.currency-cordoba': CurrenciesCurrencyCordoba;
      'currencies.currency-dollar': CurrenciesCurrencyDollar;
      'currencies.currency-lempira': CurrenciesCurrencyLempira;
      'currencies.currency-peso-mexicano': CurrenciesCurrencyPesoMexicano;
      'currencies.currency-quetzal': CurrenciesCurrencyQuetzal;
      'unit-types.housing': UnitTypesHousing;
      'unit-types.industrial': UnitTypesIndustrial;
      'unit-types.offices': UnitTypesOffices;
    }
  }
}
