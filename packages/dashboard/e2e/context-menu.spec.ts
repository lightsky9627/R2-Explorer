import { test, expect } from "@playwright/test";
import { uploadFile, createFolder, deleteObject, BUCKET } from "./helpers";

test.describe("Context menu", () => {
	test.beforeAll(async ({ request }) => {
		await uploadFile(request, "e2e-ctx-file.txt", "context menu test");
		await createFolder(request, "e2e-ctx-folder");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-ctx-file.txt");
		await deleteObject(request, "e2e-ctx-folder/");
	});

	test("shows file menu items on right-click", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-ctx-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-ctx-file.txt").click({ button: "right" });

		// File context menu should show all file-specific items (scoped to menu)
		const menu = page.locator(".q-menu");
		await expect(menu.getByText("打开")).toBeVisible();
		await expect(menu.getByText("下载")).toBeVisible();
		await expect(menu.getByText("重命名")).toBeVisible();
		await expect(menu.getByText("编辑元数据")).toBeVisible();
		await expect(menu.getByText("创建分享链接")).toBeVisible();
		await expect(menu.getByText("复制控制台链接")).toBeVisible();
		await expect(menu.getByText("删除")).toBeVisible();
	});

	test("shows folder menu items on right-click (no Download/Rename)", async ({
		page,
	}) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-ctx-folder/")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-ctx-folder/").click({ button: "right" });

		const menu = page.locator(".q-menu");

		// Folder-specific: should have Open and Delete
		await expect(menu.getByText("打开")).toBeVisible();
		await expect(menu.getByText("删除")).toBeVisible();

		// Should NOT have file-only items
		await expect(menu.getByText("下载")).not.toBeVisible();
		await expect(menu.getByText("重命名")).not.toBeVisible();
		await expect(menu.getByText("编辑元数据")).not.toBeVisible();
	});

	test("opens file via context menu Open", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-ctx-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-ctx-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("打开").click();

		// File preview should open
		await expect(page.locator("text=context menu test")).toBeVisible({
			timeout: 10_000,
		});
	});

	test("opens folder via context menu Open", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-ctx-folder/")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-ctx-folder/").click({ button: "right" });
		await page.locator(".q-menu").getByText("打开").click();

		// Should navigate into the folder (URL changes)
		await expect(page).toHaveURL(/\/files\//, { timeout: 5_000 });
	});
});
