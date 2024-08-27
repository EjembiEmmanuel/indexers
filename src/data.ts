import { PrismaClient } from "@prisma/client";
import { writeFileSync } from 'fs';

async function run() {
    const prisma = new PrismaClient();

    const result = await prisma.subscriptions.findMany();
    console.log(result);
}

async function dnmm() {
    const prisma = new PrismaClient();
    
    // get distinct contracts
    const result2 = await prisma.dnmm_user_actions.findMany({
        distinct: ['contract']
    });
    // console.log(result2)

    const result = await prisma.dnmm_user_actions.findMany({
        orderBy: [{
            block_number: 'asc',
        }, {
            txIndex: 'asc',
        }, {
            eventIndex: 'asc',
        }],
        where: {
            contract: '0x20d5fc4c9df4f943ebb36078e703369c04176ed00accf290e8295b659d2cea6',
            block_number: {
                gt: 661768
            }
        }
    });
    // console.log(result);
    console.log(result.length);

    const roundSharesMap: any = {};
    result.forEach((action: any) => {
        const existing = roundSharesMap[action.owner];
        if (existing) {
            existing.points += existing.lpShares * BigInt(action.block_number - existing.block_number);
            existing.lpShares = BigInt(action.position_acc1_supply_shares);
            existing.block_number = action.block_number
            existing.actions.push({
                block: action.block_number,
                amount: (BigInt(action.position_acc1_supply_shares) / BigInt(10 ** 18)).toString(),
                fullAmount: action.position_acc1_supply_shares,
                type: action.type,
                diff: action.block_number - existing.actions[existing.actions.length - 1].block
            })
            roundSharesMap[action.owner] = existing;
        } else {
            roundSharesMap[action.owner] = {
                lpShares: BigInt(action.position_acc1_supply_shares),
                block_number: action.block_number,
                points: BigInt(0),
                firstBlock: action.block_number,
                actions: [{
                    block: action.block_number,
                    amount: (BigInt(action.position_acc1_supply_shares) / BigInt(10 ** 18)).toString(),
                    fullAmount: action.position_acc1_supply_shares,
                    type: action.type,
                    diff: 0
                }]
            }
        }
    })

    // ! Update this
    const CURRENT_BLOCK = 661793;
    Object.keys(roundSharesMap).forEach((key) => {
        const existing = roundSharesMap[key];
        existing.points += existing.lpShares * BigInt(CURRENT_BLOCK - existing.block_number);
        existing.points = existing.points.toString()
        existing.block_number = CURRENT_BLOCK;
        existing.lpShares = existing.lpShares.toString()
        existing.diff = existing.block_number - existing.firstBlock;
        roundSharesMap[key] = existing;
    })
    console.log(roundSharesMap);
    writeFileSync('dnmm.json', JSON.stringify(roundSharesMap))
}

async function depositsAndWithdraws() {
    const prisma = new PrismaClient();

    // total deposits and withdraws
    const result = await prisma.investment_flows.aggregate({
        _count: true,
    });
    console.log("Total deposits and withdraws: ", result._count);

    // just deposits
    const deposits = await prisma.investment_flows.aggregate({
        _count: true,
        where: {
            type: 'deposit'
        }
    });
    console.log("Total deposits: ", deposits._count);

    // just withdraws
    const withdraws = await prisma.investment_flows.aggregate({
        _count: true,
        where: {
            type: 'withdraw'
        }
    });
    console.log("Total withdraws: ", withdraws._count);

    // unique users/owners
    const uniqueOwners = await prisma.investment_flows.findMany({
        distinct: ['owner'],
        select: {
            owner: true
        }
    });
    console.log("Unique owners: ", uniqueOwners.length);
    console.log("=====================================");

    // deposits and withdraws breakdown by contract
    const contracts = await prisma.investment_flows.findMany({
        distinct: ['contract'],
        select: {
            contract: true
        }
    });

    for(let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];
        const contractDeposits = await prisma.investment_flows.aggregate({
            _count: true,
            where: {
                type: 'deposit',
                contract: contract.contract
            }
        });
        const contractWithdraws = await prisma.investment_flows.aggregate({
            _count: true,
            where: {
                type: 'withdraw',
                contract: contract.contract
            }
        });
        console.log(`Contract: ${contract.contract}`);
        console.log(`Deposits: ${contractDeposits._count}`);
        console.log(`Withdraws: ${contractWithdraws._count}`);
        console.log("\n=====================================");
    };
}
// run();
// dnmm()
depositsAndWithdraws();