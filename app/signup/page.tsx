import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock, User } from 'lucide-react'
import { signup } from '@/app/auth/actions'

export const metadata = {
  title: 'რეგისტრაცია | ბიუჯეტის მართვა',
  description: 'შექმენით ახალი ანგარიში',
}

interface SignupPageProps {
  searchParams: Promise<{
    message?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { message } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to home link */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              მთავარ გვერდზე დაბრუნება
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">რეგისტრაცია</CardTitle>
            <CardDescription className="text-center">
              შექმენით ახალი ანგარიში ბიუჯეტის მართვისთვის
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show error message if available */}
            {message && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            {/* Signup Form */}
            <form action={signup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">სრული სახელი</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    className="pl-10"
                    placeholder="თქვენი სრული სახელი"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ელ. ფოსტა</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10"
                    placeholder="თქვენი ელ. ფოსტა"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">პაროლი</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="pl-10"
                    placeholder="მინიმუმ 8 სიმბოლო"
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">პაროლის დადასტურება</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="pl-10"
                    placeholder="გაიმეორეთ პაროლი"
                    minLength={8}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                რეგისტრაცია
              </Button>
            </form>

            {/* Additional options */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                უკვე გაქვთ ანგარიში?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  შედით
                </Link>
              </p>
            </div>

            {/* Demo notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>დემო რეჟიმი:</strong> ეს არის დემო ვერსია. რეგისტრაცია ჯერ არ არის სრულად კონფიგურირებული.
              </p>
              <Link href="/">
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  გაგრძელება დემო რეჟიმში
                </Button>
              </Link>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                რეგისტრაციით თქვენ ეთანხმებით ჩვენს{' '}
                <Link href="/terms" className="underline hover:text-gray-700">
                  წესებსა
                </Link>{' '}
                და{' '}
                <Link href="/privacy" className="underline hover:text-gray-700">
                  კონფიდენციალურობის პოლიტიკას
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
