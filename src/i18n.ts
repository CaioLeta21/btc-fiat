import type { Language } from './types'

const translations = {
  pt: {
    // Header
    title: 'Bitcoin em Fiat',
    subtitle: 'Como o Bitcoin protegeu contra a inflação ao redor do mundo',

    // View modes
    view_price: 'Preço em Fiat',
    view_return: 'Retorno de R$100',
    view_purchasing_power: 'Poder de Compra',
    view_m2: 'Expansão Monetária (M2)',

    // View descriptions
    desc_price: 'Quanto vale 1 BTC em cada moeda ao longo do tempo',
    desc_return: 'Se você tivesse guardado R$100 em BTC, quanto teria hoje',
    desc_purchasing_power: 'BTC vs inflação acumulada (CPI) por país',
    desc_m2: 'Crescimento da oferta monetária M2 desde a data inicial',

    // Controls
    date_from: 'De',
    date_to: 'Até',
    currencies: 'Moedas',
    select_all: 'Todas',
    clear_all: 'Limpar',
    log_scale: 'Escala Log',
    loading: 'Carregando dados...',
    loading_currency: 'Carregando',
    error_fetch: 'Erro ao carregar dados',
    retry: 'Tentar novamente',

    // Callouts
    callout_title_price: 'Preço atual em cada moeda',
    callout_title_return: 'Se você tivesse investido 100 unidades de fiat',
    callout_title_pp: 'BTC vs inflação acumulada',
    callout_title_m2: 'Expansão monetária desde a data inicial',
    callout_invested: 'R$100 investidos em',
    callout_would_be: 'valeriam hoje',
    callout_btc_gain: 'BTC valorizou',
    callout_inflation: 'Inflação acumulada',
    callout_protection: 'Proteção do BTC',
    callout_start: 'início',
    callout_today: 'hoje',

    // Disclaimers
    disclaimer_ars_title: 'Argentina: câmbio oficial vs. dólar blue',
    disclaimer_ars_body:
      'Os dados acima usam a cotação oficial do peso argentino. O câmbio paralelo ("dólar blue") mostra uma desvalorização ainda maior. A realidade vivida pela maioria dos argentinos é significativamente pior do que o gráfico demonstra.',
    disclaimer_ves_title: 'Venezuela: múltiplas redenominações',
    disclaimer_ves_body:
      'O bolívar venezuelano passou por 3 redenominações: Bolívar Forte (2008), Bolívar Soberano (2018, corte de 5 zeros) e Bolívar Digital (2021, corte de 6 zeros). Os dados podem ter lacunas ou inconsistências. A hiperinflação real é ainda mais severa do que os gráficos conseguem representar.',
    disclaimer_blue_label: 'ARS (blue)',
    disclaimer_blue_available: 'Dólar blue disponível via Bluelytics',

    // Chart
    chart_no_data: 'Sem dados para o período selecionado',
    chart_loading: 'Carregando gráfico...',
    chart_btc_line: 'BTC',
    chart_cpi_line: 'Inflação (CPI)',

    // View explanations
    explain_return_title: 'Como ler este gráfico',
    explain_return_body: 'Simula o que teria acontecido se você tivesse comprado Bitcoin com 100 unidades da moeda selecionada na data inicial. O eixo Y mostra o valor atual desse investimento, na mesma moeda. Por exemplo: R$100 investidos em BTC em janeiro de 2015 valeriam hoje mais de R$100.000. O gráfico não considera taxas de corretagem, impostos ou dividendos. É uma comparação direta: guardar dinheiro em fiat versus converter para Bitcoin.',

    explain_pp_title: 'Como ler este gráfico',
    explain_pp_body: 'Compara dois índices a partir da data inicial (base 100): a valorização do Bitcoin nessa moeda (linha laranja) e a inflação acumulada do país (linha pontilhada). Quando o Bitcoin está em 5.000 e a inflação em 150, significa que o Bitcoin multiplicou 50x enquanto os preços subiram 50%. A distância entre as duas linhas representa a proteção real que o Bitcoin ofereceu contra a perda do poder de compra. Se a linha do Bitcoin fica abaixo da inflação, o Bitcoin não protegeu nesse período.',

    // Footer
    sources: 'Fontes: CoinGecko, Bluelytics, Banco Mundial, FRED (Federal Reserve)',
    updated: 'Dados atualizados em tempo real',
  },

  en: {
    title: 'Bitcoin vs Fiat',
    subtitle: 'How Bitcoin protected against inflation around the world',

    view_price: 'Price in Fiat',
    view_return: '$100 Return',
    view_purchasing_power: 'Purchasing Power',
    view_m2: 'Money Supply (M2)',

    desc_price: 'How much 1 BTC is worth in each currency over time',
    desc_return: 'If you had saved $100 in BTC, how much would you have today',
    desc_purchasing_power: 'BTC vs accumulated inflation (CPI) by country',
    desc_m2: 'M2 money supply growth since the start date',

    date_from: 'From',
    date_to: 'To',
    currencies: 'Currencies',
    select_all: 'All',
    clear_all: 'Clear',
    log_scale: 'Log Scale',
    loading: 'Loading data...',
    loading_currency: 'Loading',
    error_fetch: 'Error loading data',
    retry: 'Retry',

    callout_title_price: 'Current price in each currency',
    callout_title_return: 'If you had invested $100',
    callout_title_pp: 'BTC vs accumulated inflation',
    callout_title_m2: 'Monetary expansion since start date',
    callout_invested: '$100 invested in',
    callout_would_be: 'would be worth today',
    callout_btc_gain: 'BTC gained',
    callout_inflation: 'Accumulated inflation',
    callout_protection: 'BTC protection',
    callout_start: 'start',
    callout_today: 'today',

    disclaimer_ars_title: 'Argentina: official rate vs. blue dollar',
    disclaimer_ars_body:
      'Data above uses the official Argentine peso exchange rate. The parallel ("blue dollar") market shows an even greater devaluation. The reality experienced by most Argentines is significantly worse than the chart demonstrates.',
    disclaimer_ves_title: 'Venezuela: multiple redenominations',
    disclaimer_ves_body:
      'The Venezuelan bolívar underwent 3 redenominations: Bolívar Fuerte (2008), Bolívar Soberano (2018, 5 zeros cut) and Bolívar Digital (2021, 6 zeros cut). Data may have gaps or inconsistencies. The real hyperinflation is even more severe than charts can represent.',
    disclaimer_blue_label: 'ARS (blue)',
    disclaimer_blue_available: 'Blue dollar available via Bluelytics',

    chart_no_data: 'No data for the selected period',
    chart_loading: 'Loading chart...',
    chart_btc_line: 'BTC',
    chart_cpi_line: 'Inflation (CPI)',

    // View explanations
    explain_return_title: 'How to read this chart',
    explain_return_body: 'Simulates what would have happened if you had bought Bitcoin with 100 units of the selected currency at the start date. The Y axis shows the current value of that investment, in the same currency. For example: $100 invested in BTC in January 2015 would be worth over $100,000 today. The chart does not account for brokerage fees, taxes, or dividends. It is a direct comparison: holding fiat vs. converting to Bitcoin.',

    explain_pp_title: 'How to read this chart',
    explain_pp_body: 'Compares two indices from the start date (base 100): Bitcoin\'s appreciation in that currency (orange line) and the country\'s accumulated inflation (dashed line). When Bitcoin is at 5,000 and inflation at 150, it means Bitcoin multiplied 50x while prices rose 50%. The gap between the two lines represents the real protection Bitcoin provided against loss of purchasing power. If the Bitcoin line falls below inflation, Bitcoin did not protect in that period.',

    sources: 'Sources: CoinGecko, Bluelytics, World Bank, FRED (Federal Reserve)',
    updated: 'Real-time data',
  },
}

export function t(lang: Language, key: keyof typeof translations.pt): string {
  return translations[lang][key] ?? key
}

export default translations
