const scrapedContent = new Map();
let currentIndex = 0;
let isCompleted = false;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function collectAllItemIds() {
    const itemIds = new Set();
    let previousLength = 0;
    let noNewItemsCount = 0;
    
    while (noNewItemsCount < 5) {
        const items = document.querySelectorAll('.item[data-item-id]');
        items.forEach(item => {
            const itemId = item.getAttribute('data-item-id');
            if (itemId) itemIds.add(itemId);
        });
        
        if (itemIds.size === previousLength) {
            noNewItemsCount++;
        } else {
            noNewItemsCount = 0;
            previousLength = itemIds.size;
        }
        
        window.scrollTo(0, document.body.scrollHeight);
        console.log(`Found ${itemIds.size} items...`);
        await sleep(2000);
    }
    
    return Array.from(itemIds);
}

async function closeModal() {
    try {
        const closeButtons = document.querySelectorAll('.buttonFirst.closeButton');
        for (const button of closeButtons) {
            if (button.offsetParent !== null) { // 表示されているボタンのみクリック
                button.click();
                await sleep(500);
            }
        }
    } catch (error) {
        console.log('Error closing modal:', error);
    }
    await sleep(500);
}

async function findAndStoreContent(itemId) {
    await sleep(1500);
    const paragraphs = document.querySelectorAll('p[style="white-space: pre-wrap;"]');
    
    for (const p of paragraphs) {
        if (p.textContent && p.textContent.trim().length > 0) {
            scrapedContent.set(itemId, p.textContent.trim());
            return true;
        }
    }
    return false;
}

async function processItems(itemIds) {
    for (let i = 0; i < itemIds.length; i++) {
        if (isCompleted) break;
        
        const itemId = itemIds[i];
        console.log(`Processing item ${itemId} (${i + 1}/${itemIds.length})`);

        try {
            await closeModal();
            await sleep(1000);

            const modalLink = document.querySelector(`a[href="#item-${itemId}"].modal`);
            if (modalLink && modalLink.offsetParent !== null) {
                modalLink.click();
                const found = await findAndStoreContent(itemId);
                if (!found) {
                    console.log(`No content found for ${itemId}`);
                }
            } else {
                console.log(`Modal link not found or not visible for ${itemId}`);
                window.scrollTo(0, document.body.scrollHeight);
                await sleep(2000);
            }
        } catch (error) {
            console.error(`Error processing item ${itemId}:`, error);
        }
        
        await sleep(1500);
    }
    
    if (!isCompleted) {
        isCompleted = true;
        await closeModal();
        downloadContent(itemIds.length);
    }
}

function downloadContent(totalItems) {
    try {
        const content = Array.from(scrapedContent.entries())
            .map(([id, text]) => `Item ID: ${id}\n${text}\n\n`)
            .join('');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cheerz_content.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        
        console.log(`Completed: ${scrapedContent.size}/${totalItems} items`);
    } catch (error) {
        console.error('Error downloading content:', error);
    }
}

(async () => {
    try {
        console.log('Collecting item IDs...');
        window.scrollTo(0, 0);
        await sleep(1000);
        
        const itemIds = await collectAllItemIds();
        console.log(`Found ${itemIds.length} items in total`);
        
        await processItems(itemIds);
    } catch (error) {
        console.error('Error in main process:', error);
    }
})();

