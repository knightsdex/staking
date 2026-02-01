import { gql } from '@apollo/client';

export const GET_STAKING_TRANSACTIONS = gql`
  query GetStakingTransactions($first: Int = 100, $skip: Int = 0) {
    stakeds(first: $first, skip: $skip, orderBy: blockTimestamp, orderDirection: desc) {
      id
      user
      internal_id
      amount
      numDays
      endTime
      blockNumber
      blockTimestamp
      transactionHash
    }
    withdrawns(first: $first, skip: $skip, orderBy: blockTimestamp, orderDirection: desc) {
      id
      user
      internal_id
      stakedAmount
      reward
      totalAmount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;