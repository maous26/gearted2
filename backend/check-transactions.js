const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    console.log('Checking transactions...');

    const transactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, username: true, email: true } },
        product: {
          select: {
            id: true,
            title: true,
            seller: { select: { id: true, username: true, email: true } }
          }
        }
      }
    });

    console.log(`\nFound ${transactions.length} transactions:\n`);

    transactions.forEach((t, i) => {
      console.log(`${i + 1}. Transaction ID: ${t.id}`);
      console.log(`   PaymentIntent: ${t.paymentIntentId}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Amount: ${t.amount} ${t.currency}`);
      console.log(`   Buyer: ${t.buyer?.username} (${t.buyer?.email})`);
      console.log(`   Seller: ${t.product?.seller?.username} (${t.product?.seller?.email})`);
      console.log(`   Product: ${t.product?.title}`);
      console.log(`   Created: ${t.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
