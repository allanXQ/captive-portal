const clients = require("../../models/clients");
const sessions = require("../../models/sessions");
const mongoose = require("mongoose");

const subscribe = async (req, res) => {
    try {
        const { clientMac, clientIp, phoneNumber, packageName } = req.body;
        const client = await clients.findOne({ macAddress: clientMac }).lean();
        
        if (!client) {
            // Start a session for the transaction
            const session = await mongoose.startSession();
            
            try {
                // Start transaction
                await session.startTransaction();
                
                // Create new client
                const newClient = new clients({
                    phoneNumber,
                    macAddress: clientMac,
                    ipAddress: clientIp,
                });
                
                const savedClient = await newClient.save({ session });
                
                // Create new session for the client
                const newSession = new sessions({
                    clientId: savedClient._id,
                    packageName,
                });
                
                const savedSession = await newSession.save({ session });
                
                // Commit the transaction
                await session.commitTransaction();
                
                return res.status(201).json({
                    success: true,
                    message: "Client and session created successfully",
                    client: savedClient,
                    session: savedSession
                });
                
            } catch (transactionError) {
                // Rollback transaction on error
                await session.abortTransaction();
                throw transactionError;
            } finally {
                // End the session
                await session.endSession();
            }
        } else {
            // Client exists, just create a new session
            const newSession = new sessions({
                clientId: client._id,
                packageName,
            });
            
            const savedSession = await newSession.save();
            
            return res.status(200).json({
                success: true,
                message: "Session created for existing client",
                client,
                session: savedSession
            });
        }

    } catch (error) {
        console.error("Subscribe error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { subscribe };