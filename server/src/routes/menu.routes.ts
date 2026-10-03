import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { getPrimaryLocalIp, getLocalIpAddresses, generateQrCodeDataUrl } from '../services/network.service.js';

export const menuRouter = Router();

// Public: Fetch entire menu payload for customer app & offline sync
menuRouter.get('/menu', (req: Request, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT id, name, icon, display_order as "displayOrder"
      FROM categories
      ORDER BY display_order ASC, name ASC
    `).all();

    const items = db.prepare(`
      SELECT
        id,
        name,
        original_name as "originalName",
        category_id as "categoryId",
        category_name as "category",
        subcategory,
        price,
        type,
        availability,
        description,
        image_url as "imageUrl",
        display_order as "displayOrder",
        source_card as "sourceCard",
        needs_verification as "needsVerification",
        updated_at as "updatedAt"
      FROM menu_items
      ORDER BY display_order ASC, name ASC
    `).all().map((it: any) => ({
      ...it,
      availability: Boolean(it.availability),
      needsVerification: Boolean(it.needsVerification)
    }));

    const restaurantSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('restaurant_info') as { value: string } | undefined;
    let restaurant = {
      name: "Sree MK Food Court",
      tagline: "Good Food. Good Mood.",
      phones: ["+91 9391046296", "+91 8341189085"],
      address: "Sree MK Food Court Restaurant",
      viewOnlyNotice: "This is a view-only digital menu. Please place your order directly with the service staff.",
      currencySymbol: "₹"
    };
    if (restaurantSetting) {
      try {
        restaurant = JSON.parse(restaurantSetting.value);
      } catch (e) {}
    }

    const lastUpdatedRow = db.prepare('SELECT MAX(updated_at) as lastUpdated FROM menu_items').get() as { lastUpdated: string } | undefined;

    res.json({
      success: true,
      restaurant,
      categories,
      items,
      count: items.length,
      lastUpdated: lastUpdatedRow?.lastUpdated || new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Get network info and QR code for scanning
menuRouter.get('/network-info', async (req: Request, res: Response) => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const ipOverrideSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('preferred_ip') as { value: string } | undefined;
    const preferredIp = ipOverrideSetting?.value || process.env.LOCAL_IP;

    const currentIp = getPrimaryLocalIp(preferredIp);
    const availableIps = getLocalIpAddresses();
    const menuUrl = `http://${currentIp}:${port}/`;

    const qrDataUrl = await generateQrCodeDataUrl(menuUrl);

    res.json({
      success: true,
      currentIp,
      port,
      menuUrl,
      qrDataUrl,
      availableIps
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
