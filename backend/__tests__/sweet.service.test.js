import { SweetService } from '../src/services/sweetservice.js';
import { SweetRepository, db } from '../src/data/inMemoryDB.js';

describe('SweetService', () => {
    
    // Define initial mock data structure for a clean state before each test
    const initialSweets = [
        { id: 't1', name: 'Gummy Worms', category: 'Gummy', price: 1.50, quantity: 50 },
        { id: 't2', name: 'Milk Chocolate Bar', category: 'Chocolate', price: 3.00, quantity: 10 },
        { id: 't3', name: 'Sour Drops', category: 'Hard Candy', price: 0.50, quantity: 0 },
    ];

    // Set up a clean database mock before each test
    beforeEach(() => {
        SweetRepository.clear();
        db.sweets.push(...initialSweets);
        jest.clearAllMocks();
    });
    
    // --- CRUD Tests ---

    describe('CRUD Operations', () => {
        it('should create and retrieve a new sweet', () => {
            const sweetDto = { name: 'New Fudge', category: 'Chocolate', price: 5.00, quantity: 20 };
            const newSweet = SweetService.createSweet(sweetDto);
            
            expect(newSweet).toHaveProperty('id');
            expect(newSweet.name).toBe('New Fudge');
            
            const retrievedSweet = SweetService.getSweetById(newSweet.id);
            expect(retrievedSweet).toEqual(newSweet);
        });

        it('should get all sweets', () => {
            const sweets = SweetService.getAllSweets();
            expect(sweets).toHaveLength(initialSweets.length);
        });

        it('should update an existing sweet', () => {
            const updatedSweet = SweetService.updateSweet('t2', { price: 3.50, quantity: 15 });
            
            expect(updatedSweet.price).toBe(3.50);
            expect(updatedSweet.quantity).toBe(15);
        });

        it('should delete a sweet', () => {
            const initialCount = SweetService.getAllSweets().length;
            const success = SweetService.deleteSweet('t1');
            
            expect(success).toBe(true);
            expect(SweetService.getAllSweets().length).toBe(initialCount - 1);
            expect(SweetService.getSweetById('t1')).toBeUndefined();
        });

        it('should return undefined if sweet to update does not exist', () => {
            const result = SweetService.updateSweet('unknownId', { price: 10 });
            expect(result).toBeUndefined();
        });
        
        it('should throw error if attempting to update price or quantity to negative', () => {
             expect(() => SweetService.updateSweet('t1', { price: -10 })).toThrow('Price and quantity must be non-negative.');
             expect(() => SweetService.updateSweet('t1', { quantity: -5 })).toThrow('Price and quantity must be non-negative.');
        });
    });
    
    // --- Search Tests ---

    describe('Search and Filter', () => {
        it('should search by name (case-insensitive partial match)', () => {
            const results = SweetService.searchSweets({ name: 'choc' });
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Milk Chocolate Bar');
        });

        it('should filter by category (case-insensitive exact match)', () => {
            const results = SweetService.searchSweets({ category: 'gummy' });
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Gummy Worms');
        });

        it('should filter by min price', () => {
            const results = SweetService.searchSweets({ minPrice: 2.00 });
            expect(results).toHaveLength(1); // Only Milk Chocolate Bar (3.00)
            expect(results[0].name).toBe('Milk Chocolate Bar');
        });

        it('should filter by max price', () => {
            const results = SweetService.searchSweets({ maxPrice: 2.00 });
            expect(results).toHaveLength(2); // Gummy Worms (1.50) and Sour Drops (0.50)
            expect(results.map(s => s.name)).toEqual(expect.arrayContaining(['Gummy Worms', 'Sour Drops']));
        });

        it('should combine multiple search criteria', () => {
            const results = SweetService.searchSweets({ name: 'gummy', maxPrice: 1.00 });
            // Only 'Gummy Worms' matches name, but its price is 1.50, so nothing should match if both applied strictly
            // Let's test a case that works: Milk Chocolate Bar
            const comboResults = SweetService.searchSweets({ category: 'Chocolate', minPrice: 2.00 });
            expect(comboResults).toHaveLength(1);
            expect(comboResults[0].name).toBe('Milk Chocolate Bar');
        });
    });

    // --- Inventory Tests ---

    describe('Inventory Operations', () => {
        it('should successfully purchase a sweet (decrease quantity by 1)', () => {
            const initialQuantity = SweetService.getSweetById('t1').quantity; // 50
            const updatedSweet = SweetService.purchaseSweet('t1');
            
            expect(updatedSweet.quantity).toBe(initialQuantity - 1);
        });
        
        it('should successfully purchase multiple sweets', () => {
            const initialQuantity = SweetService.getSweetById('t2').quantity; // 10
            const updatedSweet = SweetService.purchaseSweet('t2', 3);
            
            expect(updatedSweet.quantity).toBe(initialQuantity - 3); // 7
        });

        it('should throw an error when purchasing a sweet with zero stock', async () => {
            // Sweet t3 has 0 quantity
            expect(() => SweetService.purchaseSweet('t3')).toThrow('Not enough stock available');
        });
        
        it('should throw an error when purchasing more than stock available', async () => {
            // Sweet t2 has 10 quantity
            expect(() => SweetService.purchaseSweet('t2', 11)).toThrow('Not enough stock available');
        });

        it('should successfully restock a sweet (increase quantity by 1)', () => {
            const initialQuantity = SweetService.getSweetById('t3').quantity; // 0
            const updatedSweet = SweetService.restockSweet('t3');
            
            expect(updatedSweet.quantity).toBe(initialQuantity + 1); // 1
        });
        
        it('should successfully restock multiple sweets', () => {
            const initialQuantity = SweetService.getSweetById('t1').quantity; // 50
            const updatedSweet = SweetService.restockSweet('t1', 25);
            
            expect(updatedSweet.quantity).toBe(initialQuantity + 25); // 75
        });
        
        it('should throw an error if sweet is not found during purchase', () => {
            expect(() => SweetService.purchaseSweet('nonExistentId')).toThrow('Sweet not found');
        });

        it('should throw an error if sweet is not found during restock', () => {
            expect(() => SweetService.restockSweet('nonExistentId')).toThrow('Sweet not found');
        });
        
        it('should throw an error if restock quantity is not positive', () => {
            expect(() => SweetService.restockSweet('t1', 0)).toThrow('Restock quantity must be positive');
            expect(() => SweetService.restockSweet('t1', -5)).toThrow('Restock quantity must be positive');
        });
        
        it('should throw an error if purchase quantity is not positive', () => {
            expect(() => SweetService.purchaseSweet('t1', 0)).toThrow('Purchase quantity must be positive');
            expect(() => SweetService.purchaseSweet('t1', -5)).toThrow('Purchase quantity must be positive');
        });
    });
});
