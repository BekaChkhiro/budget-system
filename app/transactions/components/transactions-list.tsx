import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export function TransactionsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ტრანზაქციების ისტორია</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <Calendar className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            ტრანზაქციები არ მოიძებნა
          </h3>
          <p className="text-sm text-muted-foreground">
            დაამატეთ თქვენი პირველი ტრანზაქცია დასაწყებად
          </p>
        </div>
      </CardContent>
    </Card>
  )
}