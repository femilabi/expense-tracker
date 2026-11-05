-- CreateTable
CREATE TABLE `budgets` (
    `id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `category` ENUM('food', 'internet', 'drinks', 'transport', 'rent', 'utilities', 'health', 'entertainment', 'shopping', 'other') NOT NULL,
    `year` SMALLINT NOT NULL,
    `month` SMALLINT NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `budgets_user_id_year_month_category_key`(`user_id`, `year`, `month`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

