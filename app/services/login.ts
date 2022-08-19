export const authenticate = () => {
    const stringifiedVerif = localStorage['verification'];
    console.log(JSON.parse(stringifiedVerif))
}
