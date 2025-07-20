// src/services/translationService.ts
import axios, { AxiosError } from 'axios'

// URL for MyMemory Translation API
// No key is needed for 1000 requests/day. For higher volume, free registration is required.
const MYMEMORY_API_BASE_URL = 'https://api.mymemory.translated.net/get'

// --- Type Definitions for MyMemory API Response ---
interface MyMemoryTranslation {
  match: number
  segment: string
  translation: string
  quality: number
  reference: string | null // Type can be anything or null
  usage_count: number
  subject: string | null
  untrusted_translation?: boolean // Optional field
  engine_used?: string // Optional field
}

interface MyMemorySuccessResponse {
  responseData: {
    translatedText: string
    match: number
  }
  matches: MyMemoryTranslation[]
  quotaFinished: boolean // true if quota is exceeded
  responseDetails: string // "Quota Exceeded" if quota is exceeded
  responseStatus: number // 200 for success, 403 if quota is exceeded
  responderId: string
  exception_code?: number // Optional
  mtLangSupported?: string | null // Optional
}

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> => {
  try {
    // Encode the text for the URL to prevent issues with special characters
    const encodedText = encodeURIComponent(text)

    // Construct the full URL for the MyMemory API request
    const apiUrl = `${MYMEMORY_API_BASE_URL}?q=${encodedText}&langpair=${sourceLang}|${targetLang}`

    // Execute a GET request. MyMemory API uses GET for translation.
    // We specify the type of data Axios expects in the response (MyMemorySuccessResponse)
    const response = await axios.get<MyMemorySuccessResponse>(apiUrl)

    // MyMemory API returns a 200 status even if the quota is exceeded,
    // but in that case, responseData.translatedText will be empty,
    // and quotaFinished will be true with responseStatus 403.
    if (response.data.quotaFinished && response.data.responseStatus === 403) {
      throw new Error(
        `MyMemory API: ${
          response.data.responseDetails || 'Request quota exceeded.'
        }`,
      )
    }

    // Check if the translation was received and has the expected type
    if (response.data?.responseData?.translatedText) {
      return response.data.responseData.translatedText
    } else {
      throw new Error(
        'Incorrect response format from MyMemory API or translation not found.',
      )
    }
  } catch (error) {
    let errorMessage: string = 'Failed to get translation. Please try again.'

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<MyMemorySuccessResponse> // Can use the same type as errors might come in the same format

      if (axiosError.response) {
        console.error('API Error Response:', axiosError.response.data)
        console.error('API Error Status:', axiosError.response.status)

        // MyMemory returns responseStatus 403 if the quota is exceeded
        if (axiosError.response.status === 403) {
          errorMessage = `MyMemory API: ${
            axiosError.response.data?.responseDetails ||
            'Request quota exceeded.'
          }`
        } else if (axiosError.response.data?.responseDetails) {
          errorMessage = `API error: ${axiosError.response.data.responseDetails}`
        } else {
          errorMessage = `Server error: ${axiosError.response.status} ${
            axiosError.response.statusText || ''
          }`
        }
      } else if (axiosError.request) {
        errorMessage =
          'Problem connecting to MyMemory API. Please check your internet connection.'
      } else {
        errorMessage = 'Error preparing the translation request.'
      }
    } else {
      errorMessage = error instanceof Error ? error.message : String(error)
    }

    throw new Error(errorMessage)
  }
}
