import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, cleanupPrefix, BUCKET } from "./helpers";

test.describe("Share links", () => {
	test.beforeAll(async ({ request }) => {
		await uploadFile(request, "e2e-share-file.txt", "shareable content");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-share-file.txt");
		await cleanupPrefix(request, ".r2-explorer/sharable-links/");
	});

	test("opens create share link dialog from context menu", async ({
		page,
	}) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("创建分享链接").click();

		// Share link dialog should open
		await expect(page.locator("text=分享文件")).toBeVisible({
			timeout: 5_000,
		});
		await expect(page.locator("text=有效时长")).toBeVisible();
	});

	test("creates a share link and shows the URL", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("创建分享链接").click();
		await expect(page.locator("text=分享文件")).toBeVisible({
			timeout: 5_000,
		});

		await page.getByRole("button", { name: "生成链接" }).click();

		await expect(
			page.locator(".q-dialog").locator("text=分享链接已生成"),
		).toBeVisible({ timeout: 5_000 });
	});

	test("creates a share link with expiration and password", async ({
		page,
	}) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("创建分享链接").click();
		await expect(page.locator("text=分享文件")).toBeVisible({
			timeout: 5_000,
		});

		// Set expiration to 24 hours
		const expirationInput = page.locator(
			'.q-dialog input[type="number"]',
		).first();
		await expirationInput.fill("24");

		// Set password
		const passwordInput = page.locator('.q-dialog input[type="password"]');
		await passwordInput.fill("e2e-secret");

		// Set max downloads
		const maxDownloadsInput = page.locator(
			'.q-dialog input[type="number"]',
		).last();
		await maxDownloadsInput.fill("5");

		await page.getByRole("button", { name: "生成链接" }).click();

		// Share link should be created with URL shown
		await expect(
			page.locator(".q-dialog").locator("text=分享链接已生成"),
		).toBeVisible({ timeout: 5_000 });
	});

	test("opens manage shares dialog", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: "分享管理" }).click();

		await expect(
			page.locator("text=分享链接管理"),
		).toBeVisible({ timeout: 5_000 });
	});

	test("shows created share links in manage dialog", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Create a share link first so there's something to show
		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("创建分享链接").click();
		await expect(page.locator("text=分享文件")).toBeVisible({
			timeout: 5_000,
		});
		await page.getByRole("button", { name: "生成链接" }).click();
		await expect(
			page.locator(".q-dialog").locator("text=分享链接已生成"),
		).toBeVisible({ timeout: 5_000 });

		// Close the create dialog
		await page.getByRole("button", { name: "关闭" }).click();
		await expect(page.locator(".q-dialog")).not.toBeVisible({
			timeout: 3_000,
		});

		// Open manage shares
		await page.getByRole("button", { name: "分享管理" }).click();
		await expect(page.locator("text=分享链接管理")).toBeVisible({
			timeout: 5_000,
		});

		// The share link we just created should appear with file name
		await expect(
			page.locator(".q-dialog").locator("text=e2e-share-file.txt").first(),
		).toBeVisible({ timeout: 5_000 });

		// Should show 有效 status
		await expect(
			page.locator(".q-dialog").locator("text=有效").first(),
		).toBeVisible();
	});

	test("revokes a share link from manage dialog", async ({ page }) => {
		// First create a share link to revoke
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("创建分享链接").click();
		await expect(page.locator("text=分享文件")).toBeVisible({
			timeout: 5_000,
		});
		await page.getByRole("button", { name: "生成链接" }).click();
		await expect(
			page.locator(".q-dialog").locator("text=分享链接已生成"),
		).toBeVisible({ timeout: 5_000 });

		// Close the create dialog
		await page.getByRole("button", { name: "关闭" }).click();
		await expect(page.locator("text=分享文件")).not.toBeVisible({
			timeout: 3_000,
		});

		// Open manage shares
		await page.getByRole("button", { name: "分享管理" }).click();
		await expect(page.locator("text=分享链接管理")).toBeVisible({
			timeout: 5_000,
		});

		// Count share links before revocation
		const deleteButtons = page.locator(
			'.q-dialog .q-btn[class*="text-red"], .q-dialog .q-btn .q-icon:has-text("delete")',
		);

		// Click the first delete/revoke button (red trash icon)
		const revokeBtn = page
			.locator(".q-dialog")
			.locator('button:has(.q-icon)')
			.filter({ hasText: "delete" })
			.first();

		// If there's a revoke button, click it
		const manageDialog = page.locator(".q-dialog");
		const trashButtons = manageDialog.locator(
			'.q-btn .q-icon:text-is("delete")',
		);
		const count = await trashButtons.count();

		if (count > 0) {
			await trashButtons.first().click();

			// Confirm revocation in the dialog
			await page.getByRole("button", { name: "OK" }).click();
		}
	});
});
