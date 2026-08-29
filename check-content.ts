import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const file = await prisma.repoFile.findFirst({
    where: { content: { not: null } },
    select: { id: true, path: true, content: true }
  })
  console.log("File with content:", file ? "Yes" : "No")
  
  const nullContentCount = await prisma.repoFile.count({
    where: { content: null }
  })
  console.log("Files with null content:", nullContentCount)
}

main().finally(() => prisma.$disconnect())
