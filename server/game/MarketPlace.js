const EventEmitter = require('events');

class MarketPlace extends EventEmitter {
    constructor(gameEngine) {
        super();
        this.gameEngine = gameEngine;
        this.listings = new Map();
        this.auctions = new Map();
        this.trades = new Map();
        this.bids = new Map();
        this.transactions = new Map();
        this.marketHistory = new Map();
        this.priceHistory = new Map();
        this.watchLists = new Map();
        this.blacklistedItems = new Set();
        this.marketCategories = new Map();
        this.featuredItems = new Map();
        this.playerShops = new Map();
        this.guildMarkets = new Map();
        this.escrowService = new Map();
        this.marketTaxes = new Map();
        this.statistics = {
            totalListings: 0,
            totalSales: 0,
            totalValue: 0,
            activeAuctions: 0,
            completedAuctions: 0,
            averagePrice: 0,
            mostExpensiveSale: 0,
            totalTaxesCollected: 0,
            uniqueSellers: 0,
            uniqueBuyers: 0,
            totalTransactions: 0
        };
        this.config = {
            maxListingsPerPlayer: 50,
            maxAuctionsPerPlayer: 10,
            listingFee: 0.02, // 2% of listing price
            auctionFee: 0.05, // 5% of final price
            maxListingDuration: 604800000, // 7 days
            maxAuctionDuration: 259200000, // 3 days
            minListingPrice: 1,
            maxListingPrice: 1000000,
            enableBuyout: true,
            enableBidding: true,
            autoRelist: false,
            marketTaxRate: 0.05, // 5% market tax
            escrowProtection: true,
            allowCOD: true, // Cash on delivery
            searchHistoryLimit: 100
        };
        this.searchCache = new Map();
        this.marketAnalytics = new Map();
        this.priceAlerts = new Map();
        this.marketBots = new Map();
        this.fraudDetection = new Map();
    }

    async initialize() {
        console.log('Initializing MarketPlace...');
        
        try {
            // Initialize market categories
            this.initializeMarketCategories();
            
            // Load existing listings and auctions
            await this.loadMarketData();
            
            // Initialize price tracking
            await this.initializePriceTracking();
            
            // Setup market analytics
            this.setupMarketAnalytics();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            // Initialize fraud detection
            this.initializeFraudDetection();
            
            console.log('MarketPlace initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize MarketPlace:', error);
            throw error;
        }
    }

    initializeMarketCategories() {
        const categories = [
            {
                id: 'weapons',
                name: 'Weapons',
                description: 'Swords, bows, staffs, and other weapons',
                subcategories: ['swords', 'bows', 'staffs', 'daggers', 'maces', 'axes']
            },
            {
                id: 'armor',
                name: 'Armor',
                description: 'Protective gear and clothing',
                subcategories: ['helmets', 'chestplates', 'leggings', 'boots', 'shields', 'accessories']
            },
            {
                id: 'consumables',
                name: 'Consumables',
                description: 'Potions, food, and other consumable items',
                subcategories: ['potions', 'food', 'scrolls', 'ammunition']
            },
            {
                id: 'materials',
                name: 'Materials',
                description: 'Crafting materials and resources',
                subcategories: ['ores', 'gems', 'herbs', 'leather', 'cloth', 'wood']
            },
            {
                id: 'rare',
                name: 'Rare Items',
                description: 'Unique and rare items',
                subcategories: ['artifacts', 'relics', 'legendary', 'epic']
            },
            {
                id: 'pets',
                name: 'Pets & Mounts',
                description: 'Companions and transportation',
                subcategories: ['pets', 'mounts', 'pet_equipment']
            },
            {
                id: 'misc',
                name: 'Miscellaneous',
                description: 'Other items',
                subcategories: ['keys', 'books', 'decorative', 'tools']
            }
        ];

        categories.forEach(category => {
            this.marketCategories.set(category.id, category);
        });

        console.log(`Initialized ${this.marketCategories.size} market categories`);
    }

    async loadMarketData() {
        try {
            // Load listings
            const listingData = await this.gameEngine.database.collection('market_listings')
                .find({ status: 'active' }).toArray();

            for (const listing of listingData) {
                this.listings.set(listing.id, listing);
                this.statistics.totalListings++;
            }

            // Load auctions
            const auctionData = await this.gameEngine.database.collection('market_auctions')
                .find({ status: 'active' }).toArray();

            for (const auction of auctionData) {
                this.auctions.set(auction.id, auction);
                this.statistics.activeAuctions++;
            }

            // Load transaction history
            const transactionData = await this.gameEngine.database.collection('market_transactions')
                .find({}).sort({ timestamp: -1 }).limit(1000).toArray();

            for (const transaction of transactionData) {
                this.transactions.set(transaction.id, transaction);
                this.statistics.totalTransactions++;
                this.statistics.totalValue += transaction.finalPrice;
            }

            console.log(`Loaded ${this.listings.size} listings and ${this.auctions.size} auctions`);
        } catch (error) {
            console.error('Failed to load market data:', error);
        }
    }

    async initializePriceTracking() {
        try {
            // Load price history for popular items
            const priceData = await this.gameEngine.database.collection('price_history')
                .find({}).toArray();

            for (const price of priceData) {
                if (!this.priceHistory.has(price.itemId)) {
                    this.priceHistory.set(price.itemId, []);
                }
                this.priceHistory.get(price.itemId).push({
                    price: price.price,
                    timestamp: price.timestamp,
                    quantity: price.quantity
                });
            }

            console.log(`Loaded price history for ${this.priceHistory.size} items`);
        } catch (error) {
            console.error('Failed to load price history:', error);
        }
    }

    setupMarketAnalytics() {
        // Initialize analytics tracking
        this.marketAnalytics.set('daily_sales', new Map());
        this.marketAnalytics.set('popular_items', new Map());
        this.marketAnalytics.set('price_trends', new Map());
        this.marketAnalytics.set('seller_rankings', new Map());
        this.marketAnalytics.set('buyer_patterns', new Map());

        console.log('Market analytics initialized');
    }

    startBackgroundProcesses() {
        // Expire old listings and auctions
        setInterval(() => {
            this.cleanupExpiredListings();
            this.cleanupExpiredAuctions();
        }, 300000); // 5 minutes

        // Update market analytics
        setInterval(() => {
            this.updateMarketAnalytics();
        }, 600000); // 10 minutes

        // Process automatic bidding
        setInterval(() => {
            this.processAutomaticBids();
        }, 60000); // 1 minute

        // Save market data
        setInterval(() => {
            this.saveMarketData();
        }, 900000); // 15 minutes

        // Update price trends
        setInterval(() => {
            this.updatePriceTrends();
        }, 3600000); // 1 hour

        console.log('Background processes started');
    }

    initializeFraudDetection() {
        this.fraudDetection.set('price_manipulation', {
            enabled: true,
            threshold: 10.0, // 1000% price increase
            timeWindow: 3600000 // 1 hour
        });

        this.fraudDetection.set('wash_trading', {
            enabled: true,
            maxSelfTrades: 3,
            timeWindow: 86400000 // 24 hours
        });

        this.fraudDetection.set('market_flooding', {
            enabled: true,
            maxListings: 20,
            timeWindow: 3600000 // 1 hour
        });

        console.log('Fraud detection initialized');
    }

    async createListing(playerId, itemId, quantity, price, duration, buyoutPrice = null) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            if (!player) {
                return { success: false, message: 'Player not found' };
            }

            // Validate inputs
            if (price < this.config.minListingPrice || price > this.config.maxListingPrice) {
                return { 
                    success: false, 
                    message: `Price must be between ${this.config.minListingPrice} and ${this.config.maxListingPrice}` 
                };
            }

            if (duration > this.config.maxListingDuration) {
                return { 
                    success: false, 
                    message: `Duration cannot exceed ${this.config.maxListingDuration / 86400000} days` 
                };
            }

            // Check player's listing limit
            const playerListings = this.getPlayerListings(playerId);
            if (playerListings.length >= this.config.maxListingsPerPlayer) {
                return { 
                    success: false, 
                    message: `Maximum ${this.config.maxListingsPerPlayer} listings allowed` 
                };
            }

            // Check if player has the item
            const hasItem = await this.gameEngine.inventorySystem.hasItem(playerId, itemId, quantity);
            if (!hasItem) {
                return { success: false, message: 'Insufficient items in inventory' };
            }

            // Check if item is blacklisted
            if (this.blacklistedItems.has(itemId)) {
                return { success: false, message: 'Item cannot be sold on marketplace' };
            }

            // Calculate listing fee
            const listingFee = Math.floor(price * this.config.listingFee);
            if (player.gold < listingFee) {
                return { success: false, message: 'Insufficient gold for listing fee' };
            }

            // Fraud detection
            const fraudCheck = await this.checkForFraud(playerId, itemId, price, 'listing');
            if (fraudCheck.isFraudulent) {
                return { success: false, message: fraudCheck.reason };
            }

            // Remove item from inventory (place in escrow)
            await this.gameEngine.inventorySystem.removeItem(playerId, itemId, quantity);

            // Charge listing fee
            await this.gameEngine.playerManager.removeGold(playerId, listingFee);

            // Create listing
            const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const listing = {
                id: listingId,
                sellerId: playerId,
                sellerName: player.name,
                itemId: itemId,
                quantity: quantity,
                price: price,
                buyoutPrice: buyoutPrice,
                listingFee: listingFee,
                createdAt: Date.now(),
                expiresAt: Date.now() + duration,
                status: 'active',
                views: 0,
                watchers: new Set(),
                category: await this.getItemCategory(itemId),
                itemData: await this.gameEngine.itemSystem.getItem(itemId)
            };

            this.listings.set(listingId, listing);

            // Update statistics
            this.statistics.totalListings++;

            // Add to escrow
            this.escrowService.set(listingId, {
                type: 'listing',
                sellerId: playerId,
                itemId: itemId,
                quantity: quantity,
                status: 'held'
            });

            // Update price tracking
            this.updatePriceHistory(itemId, price, quantity);

            // Send notifications
            this.sendPlayerNotification(playerId, 'listing_created', {
                listingId: listingId,
                itemId: itemId,
                quantity: quantity,
                price: price
            });

            console.log(`${player.name} listed ${quantity}x ${itemId} for ${price} gold`);
            this.emit('listingCreated', listingId, listing);

            return { success: true, listing: listing };
        } catch (error) {
            console.error('Failed to create listing:', error);
            return { success: false, message: 'Failed to create listing' };
        }
    }

    async createAuction(playerId, itemId, quantity, startingBid, duration, reservePrice = null, buyoutPrice = null) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            if (!player) {
                return { success: false, message: 'Player not found' };
            }

            // Validate inputs
            if (startingBid < this.config.minListingPrice) {
                return { 
                    success: false, 
                    message: `Starting bid must be at least ${this.config.minListingPrice}` 
                };
            }

            if (duration > this.config.maxAuctionDuration) {
                return { 
                    success: false, 
                    message: `Duration cannot exceed ${this.config.maxAuctionDuration / 86400000} days` 
                };
            }

            // Check player's auction limit
            const playerAuctions = this.getPlayerAuctions(playerId);
            if (playerAuctions.length >= this.config.maxAuctionsPerPlayer) {
                return { 
                    success: false, 
                    message: `Maximum ${this.config.maxAuctionsPerPlayer} auctions allowed` 
                };
            }

            // Check if player has the item
            const hasItem = await this.gameEngine.inventorySystem.hasItem(playerId, itemId, quantity);
            if (!hasItem) {
                return { success: false, message: 'Insufficient items in inventory' };
            }

            // Check if item is blacklisted
            if (this.blacklistedItems.has(itemId)) {
                return { success: false, message: 'Item cannot be auctioned on marketplace' };
            }

            // Calculate auction fee
            const auctionFee = Math.floor(startingBid * this.config.auctionFee);
            if (player.gold < auctionFee) {
                return { success: false, message: 'Insufficient gold for auction fee' };
            }

            // Remove item from inventory (place in escrow)
            await this.gameEngine.inventorySystem.removeItem(playerId, itemId, quantity);

            // Charge auction fee
            await this.gameEngine.playerManager.removeGold(playerId, auctionFee);

            // Create auction
            const auctionId = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const auction = {
                id: auctionId,
                sellerId: playerId,
                sellerName: player.name,
                itemId: itemId,
                quantity: quantity,
                startingBid: startingBid,
                currentBid: startingBid,
                reservePrice: reservePrice,
                buyoutPrice: buyoutPrice,
                auctionFee: auctionFee,
                createdAt: Date.now(),
                expiresAt: Date.now() + duration,
                status: 'active',
                bidCount: 0,
                bids: [],
                currentBidderId: null,
                currentBidderName: null,
                views: 0,
                watchers: new Set(),
                category: await this.getItemCategory(itemId),
                itemData: await this.gameEngine.itemSystem.getItem(itemId)
            };

            this.auctions.set(auctionId, auction);

            // Update statistics
            this.statistics.activeAuctions++;

            // Add to escrow
            this.escrowService.set(auctionId, {
                type: 'auction',
                sellerId: playerId,
                itemId: itemId,
                quantity: quantity,
                status: 'held'
            });

            // Send notifications
            this.sendPlayerNotification(playerId, 'auction_created', {
                auctionId: auctionId,
                itemId: itemId,
                quantity: quantity,
                startingBid: startingBid
            });

            console.log(`${player.name} started auction for ${quantity}x ${itemId} starting at ${startingBid} gold`);
            this.emit('auctionCreated', auctionId, auction);

            return { success: true, auction: auction };
        } catch (error) {
            console.error('Failed to create auction:', error);
            return { success: false, message: 'Failed to create auction' };
        }
    }

    async placeBid(playerId, auctionId, bidAmount) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            const auction = this.auctions.get(auctionId);

            if (!player || !auction) {
                return { success: false, message: 'Player or auction not found' };
            }

            if (auction.status !== 'active') {
                return { success: false, message: 'Auction is not active' };
            }

            if (Date.now() > auction.expiresAt) {
                return { success: false, message: 'Auction has expired' };
            }

            // Can't bid on own auction
            if (auction.sellerId === playerId) {
                return { success: false, message: 'Cannot bid on your own auction' };
            }

            // Check minimum bid increment
            const minBid = auction.currentBid + Math.max(1, Math.floor(auction.currentBid * 0.05));
            if (bidAmount < minBid) {
                return { 
                    success: false, 
                    message: `Minimum bid is ${minBid} gold` 
                };
            }

            // Check player has enough gold
            if (player.gold < bidAmount) {
                return { success: false, message: 'Insufficient gold' };
            }

            // Fraud detection
            const fraudCheck = await this.checkForFraud(playerId, auction.itemId, bidAmount, 'bid');
            if (fraudCheck.isFraudulent) {
                return { success: false, message: fraudCheck.reason };
            }

            // Return gold to previous bidder
            if (auction.currentBidderId) {
                await this.gameEngine.playerManager.addGold(auction.currentBidderId, auction.currentBid);
                
                // Notify previous bidder
                this.sendPlayerNotification(auction.currentBidderId, 'bid_outbid', {
                    auctionId: auctionId,
                    itemId: auction.itemId,
                    yourBid: auction.currentBid,
                    newBid: bidAmount,
                    newBidder: player.name
                });
            }

            // Hold bidder's gold in escrow
            await this.gameEngine.playerManager.removeGold(playerId, bidAmount);

            // Update auction
            auction.currentBid = bidAmount;
            auction.currentBidderId = playerId;
            auction.currentBidderName = player.name;
            auction.bidCount++;
            auction.bids.push({
                bidderId: playerId,
                bidderName: player.name,
                amount: bidAmount,
                timestamp: Date.now()
            });

            // Extend auction if bid placed in last 5 minutes
            const timeLeft = auction.expiresAt - Date.now();
            if (timeLeft < 300000) { // 5 minutes
                auction.expiresAt += 300000; // Extend by 5 minutes
            }

            // Check for buyout
            if (auction.buyoutPrice && bidAmount >= auction.buyoutPrice) {
                return await this.executeAuctionBuyout(playerId, auctionId);
            }

            // Send notifications
            this.sendPlayerNotification(playerId, 'bid_placed', {
                auctionId: auctionId,
                itemId: auction.itemId,
                bidAmount: bidAmount,
                currentHighBid: bidAmount
            });

            this.sendPlayerNotification(auction.sellerId, 'auction_bid_received', {
                auctionId: auctionId,
                itemId: auction.itemId,
                bidAmount: bidAmount,
                bidderName: player.name
            });

            // Notify watchers
            this.notifyWatchers(auctionId, 'new_bid', {
                bidAmount: bidAmount,
                bidderName: player.name,
                timeLeft: auction.expiresAt - Date.now()
            });

            console.log(`${player.name} bid ${bidAmount} gold on auction ${auctionId}`);
            this.emit('bidPlaced', auctionId, playerId, bidAmount);

            return { success: true, currentBid: bidAmount };
        } catch (error) {
            console.error('Failed to place bid:', error);
            return { success: false, message: 'Failed to place bid' };
        }
    }

    async buyListing(playerId, listingId, quantity = null) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            const listing = this.listings.get(listingId);

            if (!player || !listing) {
                return { success: false, message: 'Player or listing not found' };
            }

            if (listing.status !== 'active') {
                return { success: false, message: 'Listing is not active' };
            }

            if (Date.now() > listing.expiresAt) {
                return { success: false, message: 'Listing has expired' };
            }

            // Can't buy from yourself
            if (listing.sellerId === playerId) {
                return { success: false, message: 'Cannot buy your own listing' };
            }

            // Calculate quantity to buy
            const buyQuantity = quantity || listing.quantity;
            if (buyQuantity > listing.quantity) {
                return { success: false, message: 'Not enough quantity available' };
            }

            // Calculate total price
            const totalPrice = listing.price * buyQuantity;
            const marketTax = Math.floor(totalPrice * this.config.marketTaxRate);
            const sellerReceives = totalPrice - marketTax;

            // Check buyer has enough gold
            if (player.gold < totalPrice) {
                return { success: false, message: 'Insufficient gold' };
            }

            // Process transaction
            await this.gameEngine.playerManager.removeGold(playerId, totalPrice);
            await this.gameEngine.playerManager.addGold(listing.sellerId, sellerReceives);
            await this.gameEngine.inventorySystem.addItem(playerId, listing.itemId, buyQuantity);

            // Update listing
            listing.quantity -= buyQuantity;
            if (listing.quantity <= 0) {
                listing.status = 'sold';
                this.listings.delete(listingId);
                this.escrowService.delete(listingId);
            }

            // Create transaction record
            const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const transaction = {
                id: transactionId,
                type: 'listing_purchase',
                listingId: listingId,
                sellerId: listing.sellerId,
                sellerName: listing.sellerName,
                buyerId: playerId,
                buyerName: player.name,
                itemId: listing.itemId,
                quantity: buyQuantity,
                unitPrice: listing.price,
                totalPrice: totalPrice,
                marketTax: marketTax,
                sellerReceives: sellerReceives,
                timestamp: Date.now()
            };

            this.transactions.set(transactionId, transaction);

            // Update statistics
            this.statistics.totalSales++;
            this.statistics.totalValue += totalPrice;
            this.statistics.totalTaxesCollected += marketTax;
            if (totalPrice > this.statistics.mostExpensiveSale) {
                this.statistics.mostExpensiveSale = totalPrice;
            }

            // Update price tracking
            this.updatePriceHistory(listing.itemId, listing.price, buyQuantity);

            // Send notifications
            this.sendPlayerNotification(playerId, 'purchase_completed', {
                transactionId: transactionId,
                itemId: listing.itemId,
                quantity: buyQuantity,
                totalPrice: totalPrice
            });

            this.sendPlayerNotification(listing.sellerId, 'item_sold', {
                transactionId: transactionId,
                itemId: listing.itemId,
                quantity: buyQuantity,
                sellerReceives: sellerReceives,
                buyerName: player.name
            });

            console.log(`${player.name} bought ${buyQuantity}x ${listing.itemId} for ${totalPrice} gold`);
            this.emit('itemPurchased', listingId, playerId, buyQuantity, totalPrice);

            return { success: true, transaction: transaction };
        } catch (error) {
            console.error('Failed to buy listing:', error);
            return { success: false, message: 'Failed to complete purchase' };
        }
    }

    async executeAuctionBuyout(playerId, auctionId) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            const auction = this.auctions.get(auctionId);

            if (!player || !auction) {
                return { success: false, message: 'Player or auction not found' };
            }

            if (!auction.buyoutPrice) {
                return { success: false, message: 'Auction does not have buyout option' };
            }

            const totalPrice = auction.buyoutPrice;
            const marketTax = Math.floor(totalPrice * this.config.marketTaxRate);
            const sellerReceives = totalPrice - marketTax;

            // Return current bid to bidder if different from buyout player
            if (auction.currentBidderId && auction.currentBidderId !== playerId) {
                await this.gameEngine.playerManager.addGold(auction.currentBidderId, auction.currentBid);
            }

            // Process buyout transaction
            await this.gameEngine.playerManager.removeGold(playerId, totalPrice);
            await this.gameEngine.playerManager.addGold(auction.sellerId, sellerReceives);
            await this.gameEngine.inventorySystem.addItem(playerId, auction.itemId, auction.quantity);

            // End auction
            auction.status = 'completed';
            auction.finalPrice = totalPrice;
            auction.winnerId = playerId;
            auction.winnerName = player.name;
            auction.completedAt = Date.now();

            this.auctions.delete(auctionId);
            this.escrowService.delete(auctionId);

            // Create transaction record
            const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const transaction = {
                id: transactionId,
                type: 'auction_buyout',
                auctionId: auctionId,
                sellerId: auction.sellerId,
                sellerName: auction.sellerName,
                buyerId: playerId,
                buyerName: player.name,
                itemId: auction.itemId,
                quantity: auction.quantity,
                finalPrice: totalPrice,
                marketTax: marketTax,
                sellerReceives: sellerReceives,
                timestamp: Date.now()
            };

            this.transactions.set(transactionId, transaction);

            // Update statistics
            this.statistics.completedAuctions++;
            this.statistics.activeAuctions--;
            this.statistics.totalSales++;
            this.statistics.totalValue += totalPrice;

            // Send notifications
            this.sendPlayerNotification(playerId, 'auction_won_buyout', {
                transactionId: transactionId,
                auctionId: auctionId,
                itemId: auction.itemId,
                quantity: auction.quantity,
                finalPrice: totalPrice
            });

            this.sendPlayerNotification(auction.sellerId, 'auction_sold', {
                transactionId: transactionId,
                auctionId: auctionId,
                itemId: auction.itemId,
                quantity: auction.quantity,
                sellerReceives: sellerReceives,
                winnerName: player.name
            });

            console.log(`${player.name} bought out auction ${auctionId} for ${totalPrice} gold`);
            this.emit('auctionBoughtOut', auctionId, playerId, totalPrice);

            return { success: true, transaction: transaction };
        } catch (error) {
            console.error('Failed to execute buyout:', error);
            return { success: false, message: 'Failed to complete buyout' };
        }
    }

    async cancelListing(playerId, listingId) {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                return { success: false, message: 'Listing not found' };
            }

            if (listing.sellerId !== playerId) {
                return { success: false, message: 'Not your listing' };
            }

            if (listing.status !== 'active') {
                return { success: false, message: 'Listing is not active' };
            }

            // Return item to seller
            await this.gameEngine.inventorySystem.addItem(playerId, listing.itemId, listing.quantity);

            // Remove from marketplace
            listing.status = 'cancelled';
            this.listings.delete(listingId);
            this.escrowService.delete(listingId);

            // Send notification
            this.sendPlayerNotification(playerId, 'listing_cancelled', {
                listingId: listingId,
                itemId: listing.itemId,
                quantity: listing.quantity
            });

            console.log(`Listing ${listingId} cancelled by seller`);
            this.emit('listingCancelled', listingId, playerId);

            return { success: true };
        } catch (error) {
            console.error('Failed to cancel listing:', error);
            return { success: false, message: 'Failed to cancel listing' };
        }
    }

    async searchMarket(query, filters = {}) {
        try {
            const results = {
                listings: [],
                auctions: [],
                totalCount: 0
            };

            const searchKey = JSON.stringify({ query, filters });
            if (this.searchCache.has(searchKey)) {
                const cached = this.searchCache.get(searchKey);
                if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
                    return cached.results;
                }
            }

            // Search listings
            for (const [listingId, listing] of this.listings) {
                if (listing.status !== 'active') continue;
                if (Date.now() > listing.expiresAt) continue;

                if (this.matchesSearch(listing, query, filters)) {
                    results.listings.push(this.formatListingForSearch(listing));
                }
            }

            // Search auctions
            for (const [auctionId, auction] of this.auctions) {
                if (auction.status !== 'active') continue;
                if (Date.now() > auction.expiresAt) continue;

                if (this.matchesSearch(auction, query, filters)) {
                    results.auctions.push(this.formatAuctionForSearch(auction));
                }
            }

            results.totalCount = results.listings.length + results.auctions.length;

            // Apply sorting
            if (filters.sortBy) {
                results.listings = this.sortResults(results.listings, filters.sortBy, filters.sortOrder);
                results.auctions = this.sortResults(results.auctions, filters.sortBy, filters.sortOrder);
            }

            // Apply pagination
            if (filters.limit) {
                const offset = filters.offset || 0;
                results.listings = results.listings.slice(offset, offset + filters.limit);
                results.auctions = results.auctions.slice(offset, offset + filters.limit);
            }

            // Cache results
            this.searchCache.set(searchKey, {
                results: results,
                timestamp: Date.now()
            });

            return results;
        } catch (error) {
            console.error('Failed to search market:', error);
            return { listings: [], auctions: [], totalCount: 0 };
        }
    }

    matchesSearch(item, query, filters) {
        // Text search
        if (query) {
            const searchText = query.toLowerCase();
            const itemName = item.itemData?.name?.toLowerCase() || '';
            const itemDescription = item.itemData?.description?.toLowerCase() || '';
            
            if (!itemName.includes(searchText) && !itemDescription.includes(searchText)) {
                return false;
            }
        }

        // Category filter
        if (filters.category && item.category !== filters.category) {
            return false;
        }

        // Price range filter
        if (filters.minPrice && item.price < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice && item.price > filters.maxPrice) {
            return false;
        }

        // Quality filter
        if (filters.quality && item.itemData?.quality !== filters.quality) {
            return false;
        }

        // Level filter
        if (filters.minLevel && item.itemData?.level < filters.minLevel) {
            return false;
        }
        if (filters.maxLevel && item.itemData?.level > filters.maxLevel) {
            return false;
        }

        // Seller filter
        if (filters.seller && item.sellerName !== filters.seller) {
            return false;
        }

        return true;
    }

    formatListingForSearch(listing) {
        return {
            id: listing.id,
            type: 'listing',
            itemId: listing.itemId,
            itemData: listing.itemData,
            quantity: listing.quantity,
            price: listing.price,
            unitPrice: listing.price,
            sellerId: listing.sellerId,
            sellerName: listing.sellerName,
            createdAt: listing.createdAt,
            expiresAt: listing.expiresAt,
            timeLeft: listing.expiresAt - Date.now(),
            views: listing.views,
            category: listing.category
        };
    }

    formatAuctionForSearch(auction) {
        return {
            id: auction.id,
            type: 'auction',
            itemId: auction.itemId,
            itemData: auction.itemData,
            quantity: auction.quantity,
            startingBid: auction.startingBid,
            currentBid: auction.currentBid,
            reservePrice: auction.reservePrice,
            buyoutPrice: auction.buyoutPrice,
            bidCount: auction.bidCount,
            sellerId: auction.sellerId,
            sellerName: auction.sellerName,
            currentBidderId: auction.currentBidderId,
            currentBidderName: auction.currentBidderName,
            createdAt: auction.createdAt,
            expiresAt: auction.expiresAt,
            timeLeft: auction.expiresAt - Date.now(),
            views: auction.views,
            category: auction.category
        };
    }

    sortResults(results, sortBy, sortOrder = 'asc') {
        return results.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'price':
                    valueA = a.price || a.currentBid;
                    valueB = b.price || b.currentBid;
                    break;
                case 'time':
                    valueA = a.timeLeft;
                    valueB = b.timeLeft;
                    break;
                case 'name':
                    valueA = a.itemData?.name || '';
                    valueB = b.itemData?.name || '';
                    break;
                case 'level':
                    valueA = a.itemData?.level || 0;
                    valueB = b.itemData?.level || 0;
                    break;
                case 'quality':
                    valueA = a.itemData?.quality || '';
                    valueB = b.itemData?.quality || '';
                    break;
                default:
                    valueA = a.createdAt;
                    valueB = b.createdAt;
            }

            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if (sortOrder === 'desc') {
                return valueA < valueB ? 1 : (valueA > valueB ? -1 : 0);
            } else {
                return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
            }
        });
    }

    async getItemCategory(itemId) {
        try {
            const itemData = await this.gameEngine.itemSystem.getItem(itemId);
            if (itemData && itemData.category) {
                return itemData.category;
            }
            return 'misc';
        } catch (error) {
            return 'misc';
        }
    }

    getPlayerListings(playerId) {
        return Array.from(this.listings.values()).filter(listing => 
            listing.sellerId === playerId && listing.status === 'active'
        );
    }

    getPlayerAuctions(playerId) {
        return Array.from(this.auctions.values()).filter(auction => 
            auction.sellerId === playerId && auction.status === 'active'
        );
    }

    async addToWatchList(playerId, listingId, auctionId) {
        try {
            if (!this.watchLists.has(playerId)) {
                this.watchLists.set(playerId, new Set());
            }

            const watchList = this.watchLists.get(playerId);
            const itemId = listingId || auctionId;
            
            if (watchList.has(itemId)) {
                return { success: false, message: 'Item already in watch list' };
            }

            watchList.add(itemId);

            // Add to item's watchers
            if (listingId && this.listings.has(listingId)) {
                this.listings.get(listingId).watchers.add(playerId);
            } else if (auctionId && this.auctions.has(auctionId)) {
                this.auctions.get(auctionId).watchers.add(playerId);
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to add to watch list:', error);
            return { success: false, message: 'Failed to add to watch list' };
        }
    }

    notifyWatchers(itemId, eventType, data) {
        let watchers = new Set();

        if (this.listings.has(itemId)) {
            watchers = this.listings.get(itemId).watchers;
        } else if (this.auctions.has(itemId)) {
            watchers = this.auctions.get(itemId).watchers;
        }

        for (const playerId of watchers) {
            this.sendPlayerNotification(playerId, `watch_${eventType}`, {
                itemId: itemId,
                ...data
            });
        }
    }

    async checkForFraud(playerId, itemId, price, actionType) {
        try {
            const fraudResult = { isFraudulent: false, reason: '' };

            // Price manipulation detection
            if (this.fraudDetection.get('price_manipulation').enabled) {
                const recentPrices = this.getRecentPrices(itemId, 3600000); // 1 hour
                if (recentPrices.length > 0) {
                    const avgPrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
                    const priceRatio = price / avgPrice;
                    
                    if (priceRatio > this.fraudDetection.get('price_manipulation').threshold) {
                        fraudResult.isFraudulent = true;
                        fraudResult.reason = 'Suspicious price manipulation detected';
                        return fraudResult;
                    }
                }
            }

            // Market flooding detection
            if (this.fraudDetection.get('market_flooding').enabled && actionType === 'listing') {
                const recentListings = this.getPlayerRecentListings(playerId, 3600000); // 1 hour
                if (recentListings.length > this.fraudDetection.get('market_flooding').maxListings) {
                    fraudResult.isFraudulent = true;
                    fraudResult.reason = 'Too many listings created recently';
                    return fraudResult;
                }
            }

            return fraudResult;
        } catch (error) {
            console.error('Error in fraud detection:', error);
            return { isFraudulent: false, reason: '' };
        }
    }

    getRecentPrices(itemId, timeWindow) {
        const now = Date.now();
        const prices = [];

        for (const transaction of this.transactions.values()) {
            if (transaction.itemId === itemId && 
                (now - transaction.timestamp) <= timeWindow) {
                prices.push(transaction.unitPrice || transaction.finalPrice);
            }
        }

        return prices;
    }

    getPlayerRecentListings(playerId, timeWindow) {
        const now = Date.now();
        const listings = [];

        for (const listing of this.listings.values()) {
            if (listing.sellerId === playerId && 
                (now - listing.createdAt) <= timeWindow) {
                listings.push(listing);
            }
        }

        return listings;
    }

    updatePriceHistory(itemId, price, quantity) {
        if (!this.priceHistory.has(itemId)) {
            this.priceHistory.set(itemId, []);
        }

        const history = this.priceHistory.get(itemId);
        history.push({
            price: price,
            quantity: quantity,
            timestamp: Date.now()
        });

        // Keep only recent history (last 100 entries)
        if (history.length > 100) {
            history.shift();
        }
    }

    cleanupExpiredListings() {
        const now = Date.now();
        const expiredListings = [];

        for (const [listingId, listing] of this.listings) {
            if (listing.status === 'active' && now > listing.expiresAt) {
                expiredListings.push(listingId);
            }
        }

        for (const listingId of expiredListings) {
            const listing = this.listings.get(listingId);
            
            // Return item to seller
            this.gameEngine.inventorySystem.addItem(listing.sellerId, listing.itemId, listing.quantity);
            
            // Remove listing
            listing.status = 'expired';
            this.listings.delete(listingId);
            this.escrowService.delete(listingId);

            // Notify seller
            this.sendPlayerNotification(listing.sellerId, 'listing_expired', {
                listingId: listingId,
                itemId: listing.itemId,
                quantity: listing.quantity
            });
        }

        if (expiredListings.length > 0) {
            console.log(`Cleaned up ${expiredListings.length} expired listings`);
        }
    }

    cleanupExpiredAuctions() {
        const now = Date.now();
        const expiredAuctions = [];

        for (const [auctionId, auction] of this.auctions) {
            if (auction.status === 'active' && now > auction.expiresAt) {
                expiredAuctions.push(auctionId);
            }
        }

        for (const auctionId of expiredAuctions) {
            this.finalizeAuction(auctionId);
        }

        if (expiredAuctions.length > 0) {
            console.log(`Finalized ${expiredAuctions.length} expired auctions`);
        }
    }

    async finalizeAuction(auctionId) {
        try {
            const auction = this.auctions.get(auctionId);
            if (!auction) return;

            auction.status = 'completed';
            auction.completedAt = Date.now();

            if (auction.currentBidderId && 
                (!auction.reservePrice || auction.currentBid >= auction.reservePrice)) {
                
                // Auction won
                const totalPrice = auction.currentBid;
                const marketTax = Math.floor(totalPrice * this.config.marketTaxRate);
                const sellerReceives = totalPrice - marketTax;

                // Transfer item to winner
                await this.gameEngine.inventorySystem.addItem(
                    auction.currentBidderId, 
                    auction.itemId, 
                    auction.quantity
                );

                // Pay seller
                await this.gameEngine.playerManager.addGold(auction.sellerId, sellerReceives);

                // Update auction
                auction.finalPrice = totalPrice;
                auction.winnerId = auction.currentBidderId;
                auction.winnerName = auction.currentBidderName;

                // Create transaction record
                const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const transaction = {
                    id: transactionId,
                    type: 'auction_win',
                    auctionId: auctionId,
                    sellerId: auction.sellerId,
                    sellerName: auction.sellerName,
                    buyerId: auction.currentBidderId,
                    buyerName: auction.currentBidderName,
                    itemId: auction.itemId,
                    quantity: auction.quantity,
                    finalPrice: totalPrice,
                    marketTax: marketTax,
                    sellerReceives: sellerReceives,
                    timestamp: Date.now()
                };

                this.transactions.set(transactionId, transaction);

                // Send notifications
                this.sendPlayerNotification(auction.currentBidderId, 'auction_won', {
                    transactionId: transactionId,
                    auctionId: auctionId,
                    itemId: auction.itemId,
                    finalPrice: totalPrice
                });

                this.sendPlayerNotification(auction.sellerId, 'auction_sold', {
                    transactionId: transactionId,
                    auctionId: auctionId,
                    itemId: auction.itemId,
                    sellerReceives: sellerReceives,
                    winnerName: auction.currentBidderName
                });

                // Update statistics
                this.statistics.completedAuctions++;
                this.statistics.totalSales++;
                this.statistics.totalValue += totalPrice;

            } else {
                // Auction failed (no bids or reserve not met)
                if (auction.currentBidderId) {
                    // Return gold to bidder
                    await this.gameEngine.playerManager.addGold(auction.currentBidderId, auction.currentBid);
                }

                // Return item to seller
                await this.gameEngine.inventorySystem.addItem(auction.sellerId, auction.itemId, auction.quantity);

                // Send notifications
                this.sendPlayerNotification(auction.sellerId, 'auction_failed', {
                    auctionId: auctionId,
                    itemId: auction.itemId,
                    reason: auction.reservePrice ? 'Reserve price not met' : 'No bids received'
                });

                if (auction.currentBidderId) {
                    this.sendPlayerNotification(auction.currentBidderId, 'auction_lost', {
                        auctionId: auctionId,
                        itemId: auction.itemId,
                        reason: 'Reserve price not met'
                    });
                }
            }

            // Remove from active auctions
            this.auctions.delete(auctionId);
            this.escrowService.delete(auctionId);
            this.statistics.activeAuctions--;

            console.log(`Auction ${auctionId} finalized`);
            this.emit('auctionFinalized', auctionId, auction);

        } catch (error) {
            console.error(`Failed to finalize auction ${auctionId}:`, error);
        }
    }

    updateMarketAnalytics() {
        // Update daily sales analytics
        const today = new Date().toDateString();
        const dailySales = this.marketAnalytics.get('daily_sales');
        
        if (!dailySales.has(today)) {
            dailySales.set(today, {
                sales: 0,
                volume: 0,
                uniqueItems: new Set()
            });
        }

        // Update popular items
        const popularItems = this.marketAnalytics.get('popular_items');
        for (const transaction of this.transactions.values()) {
            const daysSince = (Date.now() - transaction.timestamp) / 86400000;
            if (daysSince <= 7) { // Last 7 days
                if (!popularItems.has(transaction.itemId)) {
                    popularItems.set(transaction.itemId, { sales: 0, volume: 0 });
                }
                const itemStats = popularItems.get(transaction.itemId);
                itemStats.sales++;
                itemStats.volume += transaction.finalPrice || transaction.totalPrice;
            }
        }

        console.log('Market analytics updated');
    }

    updatePriceTrends() {
        for (const [itemId, history] of this.priceHistory) {
            if (history.length < 2) continue;

            const recent = history.slice(-10); // Last 10 sales
            const older = history.slice(-20, -10); // Previous 10 sales

            if (older.length === 0) continue;

            const recentAvg = recent.reduce((sum, sale) => sum + sale.price, 0) / recent.length;
            const olderAvg = older.reduce((sum, sale) => sum + sale.price, 0) / older.length;

            const priceChange = ((recentAvg - olderAvg) / olderAvg) * 100;

            const trends = this.marketAnalytics.get('price_trends');
            trends.set(itemId, {
                currentPrice: recentAvg,
                previousPrice: olderAvg,
                priceChange: priceChange,
                trend: priceChange > 5 ? 'rising' : (priceChange < -5 ? 'falling' : 'stable'),
                lastUpdated: Date.now()
            });
        }

        console.log('Price trends updated');
    }

    processAutomaticBids() {
        // Process any automatic bidding systems or bid extensions
        for (const [auctionId, auction] of this.auctions) {
            if (auction.status !== 'active') continue;

            const timeLeft = auction.expiresAt - Date.now();
            
            // Notify watchers when auction is ending soon
            if (timeLeft > 0 && timeLeft <= 300000 && !auction.endingSoonNotified) { // 5 minutes
                auction.endingSoonNotified = true;
                this.notifyWatchers(auctionId, 'ending_soon', {
                    timeLeft: timeLeft,
                    currentBid: auction.currentBid
                });
            }
        }
    }

    async saveMarketData() {
        try {
            const savePromises = [];

            // Save active listings
            for (const [listingId, listing] of this.listings) {
                const listingData = {
                    ...listing,
                    watchers: Array.from(listing.watchers)
                };
                
                savePromises.push(
                    this.gameEngine.database.collection('market_listings')
                        .replaceOne(
                            { id: listingId },
                            listingData,
                            { upsert: true }
                        )
                );
            }

            // Save active auctions
            for (const [auctionId, auction] of this.auctions) {
                const auctionData = {
                    ...auction,
                    watchers: Array.from(auction.watchers)
                };
                
                savePromises.push(
                    this.gameEngine.database.collection('market_auctions')
                        .replaceOne(
                            { id: auctionId },
                            auctionData,
                            { upsert: true }
                        )
                );
            }

            // Save recent transactions
            const recentTransactions = Array.from(this.transactions.values())
                .filter(t => Date.now() - t.timestamp < 2592000000) // Last 30 days
                .slice(-1000); // Keep only last 1000

            for (const transaction of recentTransactions) {
                savePromises.push(
                    this.gameEngine.database.collection('market_transactions')
                        .replaceOne(
                            { id: transaction.id },
                            transaction,
                            { upsert: true }
                        )
                );
            }

            await Promise.all(savePromises);
        } catch (error) {
            console.error('Failed to save market data:', error);
        }
    }

    sendPlayerNotification(playerId, type, data) {
        const player = this.gameEngine.playerManager.getPlayer(playerId);
        if (player && player.socket) {
            player.socket.emit('market:notification', {
                type: type,
                data: data,
                timestamp: Date.now()
            });
        }
    }

    getMarketStatistics() {
        return {
            ...this.statistics,
            activeListings: this.listings.size,
            averagePrice: this.statistics.totalValue / Math.max(this.statistics.totalSales, 1),
            totalActiveItems: this.listings.size + this.auctions.size
        };
    }

    getPlayerMarketStats(playerId) {
        const playerListings = this.getPlayerListings(playerId);
        const playerAuctions = this.getPlayerAuctions(playerId);
        
        let totalSales = 0;
        let totalRevenue = 0;
        let totalPurchases = 0;
        let totalSpent = 0;

        for (const transaction of this.transactions.values()) {
            if (transaction.sellerId === playerId) {
                totalSales++;
                totalRevenue += transaction.sellerReceives || 0;
            }
            if (transaction.buyerId === playerId) {
                totalPurchases++;
                totalSpent += transaction.totalPrice || transaction.finalPrice || 0;
            }
        }

        return {
            activeListings: playerListings.length,
            activeAuctions: playerAuctions.length,
            totalSales: totalSales,
            totalRevenue: totalRevenue,
            totalPurchases: totalPurchases,
            totalSpent: totalSpent,
            netProfit: totalRevenue - totalSpent
        };
    }

    destroy() {
        console.log('Destroying MarketPlace...');
        
        // Save all market data
        this.saveMarketData();
        
        // Clear all data
        this.listings.clear();
        this.auctions.clear();
        this.transactions.clear();
        this.bids.clear();
        this.watchLists.clear();
        this.searchCache.clear();
        this.priceHistory.clear();
        this.marketAnalytics.clear();
        
        console.log('MarketPlace destroyed');
    }
}

module.exports = MarketPlace;