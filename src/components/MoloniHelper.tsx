/**
 * MOLONI API Integration Helper
 * 
 * Este helper fornece funções utilitárias para integração com a API MOLONI
 * nas oficinas através do módulo de faturação.
 * 
 * Documentação completa: https://www.moloni.pt/dev/
 */

import { projectId } from '../utils/supabase/info'

export interface MoloniClient {
  customer_id?: number
  vat: string
  number: string
  name: string
  language_id: number
  address?: string
  zip_code?: string
  city?: string
  country_id?: number
  email?: string
  phone?: string
  fax?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

export interface MoloniProduct {
  product_id?: number
  category_id?: number
  type?: number // 1=Produto, 2=Serviço
  name: string
  summary?: string
  reference?: string
  ean?: string
  price: number
  unit_id?: number
  has_stock?: number
  stock?: number
  pos_favorite?: number
  at_product_category?: string
  tax_id?: number
}

export interface MoloniInvoiceProduct {
  product_id: number
  name: string
  summary?: string
  qty: number
  price: number
  discount?: number
  order?: number
  exemption_reason?: string
  warehouse_id?: number
  taxes?: Array<{
    tax_id: number
    value: number
    order: number
    cumulative: number
  }>
}

export interface MoloniDocument {
  document_id?: number
  document_set_id: number
  customer_id: number
  date: string // YYYY-MM-DD
  expiration_date?: string // YYYY-MM-DD
  your_reference?: string
  our_reference?: string
  financial_discount?: number
  special_discount?: string
  status?: number
  products: MoloniInvoiceProduct[]
  payments?: Array<{
    payment_method_id: number
    date: string
    value: number
  }>
  notes?: string
}

/**
 * MoloniAPI Class
 * 
 * Fornece métodos para interagir com a API MOLONI através do proxy do backend
 */
export class MoloniAPI {
  private workshopId: string
  private accessToken: string

  constructor(workshopId: string, accessToken: string) {
    this.workshopId = workshopId
    this.accessToken = accessToken
  }

  /**
   * Método genérico para fazer requisições à API MOLONI
   */
  private async request(endpoint: string, data: any = {}) {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/proxy/${this.workshopId}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro na requisição MOLONI')
    }

    return await response.json()
  }

  // ==================== COMPANIES ====================
  
  /**
   * Obter lista de empresas
   */
  async getCompanies() {
    return this.request('companies/getAll')
  }

  /**
   * Obter detalhes de uma empresa
   */
  async getCompany(companyId: number) {
    return this.request('companies/getOne', { company_id: companyId })
  }

  // ==================== CUSTOMERS ====================

  /**
   * Obter lista de clientes
   */
  async getCustomers(companyId: number, params: { 
    customer_id?: number
    vat?: string
    number?: string
    name?: string
    email?: string
    qty?: number
    offset?: number
  } = {}) {
    return this.request('customers/getAll', {
      company_id: companyId,
      ...params
    })
  }

  /**
   * Criar novo cliente
   */
  async createCustomer(companyId: number, customer: MoloniClient) {
    return this.request('customers/insert', {
      company_id: companyId,
      ...customer
    })
  }

  /**
   * Atualizar cliente existente
   */
  async updateCustomer(companyId: number, customer: MoloniClient & { customer_id: number }) {
    return this.request('customers/update', {
      company_id: companyId,
      ...customer
    })
  }

  /**
   * Verificar se cliente existe pelo NIF
   */
  async findCustomerByVat(companyId: number, vat: string) {
    const result = await this.request('customers/getAll', {
      company_id: companyId,
      vat: vat,
      qty: 1
    })
    return result && result.length > 0 ? result[0] : null
  }

  // ==================== PRODUCTS ====================

  /**
   * Obter lista de produtos/serviços
   */
  async getProducts(companyId: number, params: {
    category_id?: number
    product_id?: number
    reference?: string
    name?: string
    qty?: number
    offset?: number
  } = {}) {
    return this.request('products/getAll', {
      company_id: companyId,
      ...params
    })
  }

  /**
   * Criar novo produto/serviço
   */
  async createProduct(companyId: number, product: MoloniProduct) {
    return this.request('products/insert', {
      company_id: companyId,
      ...product
    })
  }

  /**
   * Atualizar produto/serviço
   */
  async updateProduct(companyId: number, product: MoloniProduct & { product_id: number }) {
    return this.request('products/update', {
      company_id: companyId,
      ...product
    })
  }

  // ==================== TAXES ====================

  /**
   * Obter lista de taxas de IVA
   */
  async getTaxes(companyId: number) {
    return this.request('taxes/getAll', {
      company_id: companyId
    })
  }

  // ==================== DOCUMENT SETS ====================

  /**
   * Obter séries de documentos
   */
  async getDocumentSets(companyId: number) {
    return this.request('documentSets/getAll', {
      company_id: companyId
    })
  }

  // ==================== INVOICES ====================

  /**
   * Obter lista de faturas
   */
  async getInvoices(companyId: number, params: {
    document_id?: number
    customer_id?: number
    date?: string
    your_reference?: string
    qty?: number
    offset?: number
  } = {}) {
    return this.request('invoices/getAll', {
      company_id: companyId,
      ...params
    })
  }

  /**
   * Obter detalhes de uma fatura
   */
  async getInvoice(companyId: number, documentId: number) {
    return this.request('invoices/getOne', {
      company_id: companyId,
      document_id: documentId
    })
  }

  /**
   * Criar nova fatura
   */
  async createInvoice(companyId: number, invoice: MoloniDocument) {
    return this.request('invoices/insert', {
      company_id: companyId,
      ...invoice
    })
  }

  /**
   * Atualizar fatura
   */
  async updateInvoice(companyId: number, invoice: MoloniDocument & { document_id: number }) {
    return this.request('invoices/update', {
      company_id: companyId,
      ...invoice
    })
  }

  /**
   * Obter PDF de fatura
   */
  async getInvoicePDF(companyId: number, documentId: number) {
    return this.request('invoices/getPDFLink', {
      company_id: companyId,
      document_id: documentId
    })
  }

  /**
   * Enviar fatura por email
   */
  async sendInvoiceByEmail(companyId: number, documentId: number, email: string, message?: string) {
    return this.request('invoices/sendByEmail', {
      company_id: companyId,
      document_id: documentId,
      email: email,
      message: message || ''
    })
  }

  // ==================== ESTIMATES (Orçamentos/Proformas) ====================

  /**
   * Obter lista de orçamentos
   */
  async getEstimates(companyId: number, params: {
    document_id?: number
    customer_id?: number
    date?: string
    qty?: number
    offset?: number
  } = {}) {
    return this.request('estimates/getAll', {
      company_id: companyId,
      ...params
    })
  }

  /**
   * Criar novo orçamento
   */
  async createEstimate(companyId: number, estimate: MoloniDocument) {
    return this.request('estimates/insert', {
      company_id: companyId,
      ...estimate
    })
  }

  /**
   * Converter orçamento em fatura
   */
  async convertEstimateToInvoice(companyId: number, documentId: number, documentSetId: number) {
    return this.request('estimates/convertToInvoice', {
      company_id: companyId,
      document_id: documentId,
      document_set_id: documentSetId
    })
  }

  // ==================== PAYMENT METHODS ====================

  /**
   * Obter métodos de pagamento
   */
  async getPaymentMethods(companyId: number) {
    return this.request('paymentMethods/getAll', {
      company_id: companyId
    })
  }

  // ==================== MEASUREMENT UNITS ====================

  /**
   * Obter unidades de medida
   */
  async getMeasurementUnits(companyId: number) {
    return this.request('measurementUnits/getAll', {
      company_id: companyId
    })
  }

  // ==================== COUNTRIES ====================

  /**
   * Obter lista de países
   */
  async getCountries() {
    return this.request('countries/getAll')
  }
}

/**
 * Hook helper para usar MOLONI API em componentes React
 */
export function useMoloniAPI(workshopId: string, accessToken: string) {
  return new MoloniAPI(workshopId, accessToken)
}

/**
 * Constantes úteis para MOLONI
 */
export const MOLONI_CONSTANTS = {
  // Tipos de Produto
  PRODUCT_TYPE: {
    PRODUCT: 1,
    SERVICE: 2
  },
  
  // IDs de Países comuns
  COUNTRIES: {
    PORTUGAL: 1,
    SPAIN: 2,
    FRANCE: 3,
    // Outros países podem ser obtidos via getCountries()
  },

  // Status de Documento
  DOCUMENT_STATUS: {
    DRAFT: 0,
    CLOSED: 1,
    DELETED: 2,
    CANCELED: 3
  }
}

export default MoloniAPI
