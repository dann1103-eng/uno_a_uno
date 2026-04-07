-- CreateTable
CREATE TABLE "topic_content" (
    "id" TEXT NOT NULL,
    "topicNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "links" JSONB NOT NULL DEFAULT '[]',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_content_topicNumber_key" ON "topic_content"("topicNumber");
