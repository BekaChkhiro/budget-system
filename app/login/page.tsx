import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { login } from '@/app/auth/actions'

export const metadata = {
  title: 'შესვლა | ბიუჯეტის მართვა',
  description: 'შედით თქვენს ანგარიშში',
}

interface LoginPageProps {
  searchParams: Promise<{
    redirectedFrom?: string
    message?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectedFrom, message } = await searchParams

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
            <CardTitle className="text-2xl text-center">შესვლა</CardTitle>
            <CardDescription className="text-center">
              შედით თქვენს ანგარიშში ბიუჯეტის მართვისთვის
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show redirect message if available */}
            {redirectedFrom && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  გვერდზე წვდომისთვის საჭიროა ავტორიზაცია
                </p>
              </div>
            )}

            {/* Show error message if available */}
            {message && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            {/* Login Form */}
            <form action={login} className="space-y-4">
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
                    autoComplete="current-password"
                    required
                    className="pl-10"
                    placeholder="თქვენი პაროლი"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                შესვლა
              </Button>
            </form>

            {/* Additional options */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                არ გაქვთ ანგარიში?{' '}
                <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  დარეგისტრირდით
                </Link>
              </p>
              <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-500">
                დაგავიწყდათ პაროლი?
              </Link>
            </div>

            {/* Demo notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>დემო რეჟიმი:</strong> ეს არის დემო ვერსია. ავტორიზაცია ჯერ არ არის სრულად კონფიგურირებული.
              </p>
              <Link href="/">
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  გაგრძელება დემო რეჟიმში
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
