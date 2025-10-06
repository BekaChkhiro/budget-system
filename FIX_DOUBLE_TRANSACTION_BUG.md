# Fix: ტრანზაქციების გაორმაგების პრობლემა

## 🐛 პრობლემის აღწერა

თქვენ შექმენით პროექტი 2500 ლარის ბიუჯეტით, რომელიც დაყოფილი იყო 2 განვადებად:
- პირველი განვადება: 1500 ლარი
- მეორე განვადება: 1000 ლარი

როცა გადაიხადეთ პირველი 1500 ლარი, სისტემა გვიჩვენებდა:
- **მიღებული თანხა: 3000 ლარი** ❌ (უნდა ყოფილიყო 1500)
- **დარჩენილი თანხა: -500 ლარი** ❌ (უნდა ყოფილიყო 1000)

## 🔍 პრობლემის მიზეზი

პრობლემა იყო `project_summary` view-ის SQL მოთხოვნაში. View იყენებდა ორ LEFT JOIN-ს:

```sql
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id
LEFT JOIN payment_installments pi ON p.id = pi.project_id
```

ეს იწვევდა **Cartesian Product**-ს (კარტესიანულ ნამრავლს), სადაც:
- ყოველი ტრანზაქცია მრავლდებოდა განვადებების რაოდენობაზე
- თუ გაქვთ 2 განვადება და 1 ტრანზაქცია, SQL გამოიღებდა 2 რიგს იმავე ტრანზაქციისთვის
- `SUM(t.amount)` გამოთვლისას: 1500 + 1500 = **3000** ❌

### მაგალითი SQL-ის შედეგით:

```
project_id | transaction_amount | installment_id
-------------------------------------------------
UUID-123   | 1500              | installment-1
UUID-123   | 1500              | installment-2  <-- დუბლიკატი!
```

## ✅ გადაწყვეტა

შევცვალეთ view-ის სტრუქტურა და გამოვიყენეთ **subqueries** JOIN-ების ნაცვლად:

### ძველი (არასწორი) SQL:
```sql
SELECT
  COALESCE(SUM(t.amount), 0) as total_received
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id
LEFT JOIN payment_installments pi ON p.id = pi.project_id
GROUP BY p.id
```

### ახალი (სწორი) SQL:
```sql
SELECT
  COALESCE((
    SELECT SUM(t.amount)
    FROM transactions t
    WHERE t.project_id = p.id
  ), 0) as total_received
FROM projects p
LEFT JOIN payment_installments pi ON p.id = pi.project_id
GROUP BY p.id
```

## 🔧 გაკეთებული ცვლილებები

### 1. შექმნილია ახალი მიგრაცია
📁 `migrations/20251001_fix_project_summary_view_v2.sql`
- აღმოფხვრილია transactions JOIN
- გამოყენებულია subquery ტრანზაქციების აგრეგაციისთვის
- შენარჩუნებულია installments JOIN (რადგან მას არ აქვს გავლენა transactions-ზე)

### 2. გასწორებულია TypeScript ველის სახელი
📁 `app/transactions/components/transaction-form.tsx`
- შეცვლილია `received_amount` -> `total_received`
- ახლა შეესაბამება TypeScript interface-ს და SQL view-ს

## 📋 როგორ გავუშვათ მიგრაცია

### ვარიანტი 1: Node.js სკრიპტით (რეკომენდებული)

```bash
node run-fix-migration.js
```

### ვარიანტი 2: Supabase Dashboard-ში

1. გადადი [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. არჩიე შენი პროექტი
3. გადადი **SQL Editor** განყოფილებაში
4. დააკოპირე და ჩაასვი `migrations/20251001_fix_project_summary_view_v2.sql` ფაილის შიგთავსი
5. დააჭირე **Run** ღილაკს

### ვარიანტი 3: Supabase CLI-ით

```bash
supabase db push
```

## ✨ შედეგი

მიგრაციის გაშვების შემდეგ:

✅ **მიღებული თანხა**: 1500 ლარი (სწორი!)
✅ **დარჩენილი თანხა**: 1000 ლარი (სწორი!)

## 🧪 როგორ დავრწმუნდეთ რომ მუშაობს

1. გაუშვი მიგრაცია
2. გადადი პროექტების გვერდზე
3. იპოვე პროექტი ბიუჯეტით 2500
4. შეამოწმე რომ:
   - მიღებული = 1500 ლარი
   - დარჩენილი = 1000 ლარი
   - პროგრესი = 60% (1500/2500)

## 🔍 დამატებითი შემოწმებები

თუ გინდა SQL-ით უშუალოდ შეამოწმო:

```sql
-- შეამოწმე კონკრეტული პროექტი
SELECT
  p.title,
  p.total_budget,
  ps.total_received,
  ps.remaining_amount,
  ps.payment_progress,
  ps.transactions_count
FROM projects p
JOIN project_summary ps ON ps.id = p.id
WHERE p.total_budget = 2500;

-- შეამოწმე ყველა ტრანზაქცია ამ პროექტისთვის
SELECT
  t.id,
  t.amount,
  t.transaction_date,
  pi.installment_number
FROM transactions t
LEFT JOIN payment_installments pi ON pi.id = t.installment_id
WHERE t.project_id = 'YOUR_PROJECT_ID';
```

## 📚 დამატებითი ინფორმაცია

### რატომ ხდებოდა ეს?

SQL-ში, როცა გაქვს რამდენიმე LEFT JOIN და მერე აგრეგირებ (SUM, COUNT, და ა.შ.), SQL ქმნის Cartesian Product-ს - ანუ ყველა კომბინაციას ორივე ცხრილის რიგებს შორის.

### რატომ არის subquery უკეთესი?

Subquery:
- მუშაობს დამოუკიდებლად თითოეული პროექტისთვის
- არ ურევს განვადებების რიგებს
- გამოითვლის ზუსტ თანხას JOIN-ის გარეშე

### შესრულება (Performance)

PostgreSQL ოპტიმიზატორი ძალიან კარგად მუშაობს subqueries-თან და ინდექსებთან, ამიტომ:
- შესრულება იგივეა ან უკეთესი
- SQL უფრო მარტივი და გასაგები
- შედეგი სწორი და პროგნოზირებადი

## 🎯 დასკვნა

პრობლემა იყო კლასიკური SQL Cartesian Product შეცდომა, სადაც რამდენიმე LEFT JOIN იწვევდა რიგების გამრავლებას. გადავწყვიტეთ subqueries-ის გამოყენებით, რაც უზრუნველყოფს:
- ✅ ზუსტ გამოთვლებს
- ✅ მარტივ SQL სტრუქტურას
- ✅ სანდო შედეგებს
- ✅ კარგ შესრულებას

---

**შენიშვნა**: ეს არის კრიტიკული bug fix. რეკომენდირებულია მიგრაციის დაუყონებლივ გაშვება.
