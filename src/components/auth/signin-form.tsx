'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signInSchema = z.object({
    email: z
        .string()
        .email('Geçerli bir e-posta adresi girin')
        .refine(
            (email) => email.endsWith('@dgmgumruk.com'),
            'Sadece @dgmgumruk.com e-posta adresleri kabul edilir'
        ),
})

type SignInFormData = z.infer<typeof signInSchema>

export function SignInForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
    })

    const onSubmit = async (data: SignInFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn('email', {
                email: data.email,
                callbackUrl,
                redirect: false,
            })

            if (result?.error) {
                setError('Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.')
            } else {
                // Redirect to verify request page
                router.push('/auth/verify-request')
            }
        } catch (error) {
            setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDevLogin = async (data: SignInFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn('dev-login', {
                email: data.email,
                callbackUrl,
                redirect: false,
            })

            if (result?.error) {
                setError('Geliştirici girişi başarısız oldu.')
            } else if (result?.ok) {
                router.push(callbackUrl)
            }
        } catch (error) {
            setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
                <label htmlFor="email" className="sr-only">
                    E-posta adresi
                </label>
                <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="E-posta adresiniz (@dgmgumruk.com)"
                    disabled={isLoading}
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Gönderiliyor...
                        </div>
                    ) : (
                        'E-posta ile Giriş Yap'
                    )}
                </button>

                {process.env.NODE_ENV === 'development' && (
                    <button
                        type="button"
                        onClick={handleSubmit(handleDevLogin)}
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Giriş yapılıyor...' : '🚀 Geliştirici Girişi (E-posta Doğrulaması Yok)'}
                    </button>
                )}
            </div>

            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    E-posta ile giriş: Size bir giriş linki göndereceğiz.
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <br />
                            <span className="text-blue-600">Geliştirici girişi: Anında giriş yapar (test için)</span>
                        </>
                    )}
                </p>
            </div>
        </form>
    )
}