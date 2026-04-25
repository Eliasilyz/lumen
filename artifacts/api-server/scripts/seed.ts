import {
  db,
  pool,
  categoriesTable,
  prayersTable,
  liturgicalDaysTable,
  wallPostsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding Lumen content…");

  await db
    .insert(categoriesTable)
    .values([
      {
        slug: "morning-evening",
        name: "Morning & Evening",
        group: "daily",
        description: "Anchors for the start and close of each day.",
      },
      {
        slug: "rosary-marian",
        name: "Rosary & Marian",
        group: "daily",
        description: "The Rosary, Angelus, and other prayers to Our Lady.",
      },
      {
        slug: "gratitude",
        name: "Thanksgiving",
        group: "daily",
        description: "Prayers of praise and gratitude.",
      },
      {
        slug: "healing",
        name: "Healing & illness",
        group: "needs",
        description: "For the sick, suffering, and those who care for them.",
      },
      {
        slug: "family",
        name: "Family & home",
        group: "needs",
        description: "For spouses, parents, and children.",
      },
      {
        slug: "work-vocation",
        name: "Work & vocation",
        group: "needs",
        description: "Discernment, working life, and study.",
      },
      {
        slug: "lent",
        name: "Lent",
        group: "liturgical",
        description: "Prayers for the season of fasting and almsgiving.",
      },
      {
        slug: "easter",
        name: "Easter",
        group: "liturgical",
        description: "Joy of the resurrection.",
      },
    ])
    .onConflictDoNothing();

  const cats = await db.select().from(categoriesTable);
  const cat = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? null;

  await db
    .insert(prayersTable)
    .values([
      {
        slug: "morning-offering",
        title: "Morning Offering",
        summary:
          "Begin the day by offering every thought, word, and action to God.",
        body: `O Jesus, through the Immaculate Heart of Mary,
I offer You my prayers, works, joys, and sufferings of this day,
in union with the Holy Sacrifice of the Mass throughout the world.

I offer them for all the intentions of Your Sacred Heart:
the salvation of souls, reparation for sin, and the reunion of all Christians.

I offer them for the intentions of our bishops and of all members of the Apostleship of Prayer,
and in particular for those recommended by our Holy Father this month.

**Amen.**`,
        group: "daily",
        categoryId: cat("morning-evening"),
        author: "Apostleship of Prayer",
        readingMinutes: 1,
      },
      {
        slug: "examen-evening",
        title: "Evening Examen",
        summary:
          "Saint Ignatius's nightly review of the day with God's grace.",
        body: `**1. Become aware of God's presence.**
Pause. Let your breath slow. The same Lord who watched the day with you is here now.

**2. Review the day with gratitude.**
Walk back through the hours. Notice the gifts: a kind word, food, rest, beauty.

**3. Pay attention to your emotions.**
What stirred you? Joy, anger, peace, fear? God speaks through these.

**4. Choose one feature of the day and pray from it.**
Ask for forgiveness, healing, or guidance.

**5. Look toward tomorrow.**
Ask the Lord for the grace you will need.

*Glory be to the Father, and to the Son, and to the Holy Spirit. Amen.*`,
        group: "daily",
        categoryId: cat("morning-evening"),
        author: "St. Ignatius of Loyola",
        readingMinutes: 4,
      },
      {
        slug: "our-father",
        title: "Our Father",
        summary: "The prayer the Lord himself taught his disciples.",
        body: `Our Father, who art in heaven,
hallowed be thy name;
thy kingdom come,
thy will be done
on earth as it is in heaven.

Give us this day our daily bread,
and forgive us our trespasses,
as we forgive those who trespass against us;
and lead us not into temptation,
but deliver us from evil.

**Amen.**`,
        group: "daily",
        categoryId: cat("morning-evening"),
        author: "Sacred Scripture",
        readingMinutes: 1,
      },
      {
        slug: "hail-mary",
        title: "Hail Mary",
        summary: "The greeting of the Angel Gabriel to Our Lady.",
        body: `Hail Mary, full of grace,
the Lord is with thee.
Blessed art thou amongst women,
and blessed is the fruit of thy womb, Jesus.

Holy Mary, Mother of God,
pray for us sinners,
now and at the hour of our death.

**Amen.**`,
        group: "daily",
        categoryId: cat("rosary-marian"),
        author: "Sacred Tradition",
        readingMinutes: 1,
      },
      {
        slug: "memorare",
        title: "Memorare",
        summary: "A confident appeal to the never-failing intercession of Mary.",
        body: `Remember, O most gracious Virgin Mary,
that never was it known
that anyone who fled to thy protection,
implored thy help, or sought thy intercession,
was left unaided.

Inspired by this confidence,
I fly unto thee, O Virgin of virgins, my Mother;
to thee do I come, before thee I stand, sinful and sorrowful.

O Mother of the Word Incarnate,
despise not my petitions,
but in thy mercy hear and answer me.

**Amen.**`,
        group: "daily",
        categoryId: cat("rosary-marian"),
        author: "St. Bernard of Clairvaux",
        readingMinutes: 2,
      },
      {
        slug: "for-the-sick",
        title: "Prayer for the Sick",
        summary: "For those carrying the cross of illness.",
        body: `Loving Father,
We lift up to you all who are sick today.
Be their strength when their bodies feel weak,
their light when the night feels long,
and their peace when fear closes in.

Grant wisdom to their doctors and tenderness to their nurses.
Surround their families with your courage.

If it be your will, restore them to health.
If you call them home, take them gently into your arms.
Through Christ our Lord.

**Amen.**`,
        group: "needs",
        categoryId: cat("healing"),
        author: null,
        readingMinutes: 2,
      },
      {
        slug: "prayer-for-family",
        title: "Prayer for the Family",
        summary: "For the home as the first sanctuary.",
        body: `Lord Jesus,
make our home a small Nazareth,
where love is patient,
where forgiveness comes quickly,
and where you are always welcome at the table.

Bless the parents with wisdom,
the children with joy,
the elders with peace,
and those who are absent with your nearness.

May we always recognize you in one another.

**Amen.**`,
        group: "needs",
        categoryId: cat("family"),
        author: null,
        readingMinutes: 2,
      },
      {
        slug: "prayer-before-work",
        title: "Prayer Before Work",
        summary: "Offering the day's labor to God.",
        body: `God of all good work,
You called craftsmen, fishermen, tax collectors, and tentmakers.
Bless the work of my hands and mind today.

Where I am tempted by pride, plant humility.
Where I am tempted to cut corners, plant integrity.
Where I am tempted by anxiety, plant trust.

May my labor serve those who depend on it
and give you glory.

**Amen.**`,
        group: "needs",
        categoryId: cat("work-vocation"),
        author: null,
        readingMinutes: 2,
      },
      {
        slug: "ash-wednesday-prayer",
        title: "Lenten Heart",
        summary: "An invitation to repentance at the start of Lent.",
        body: `Merciful God,
You formed me from dust and to dust I will return.
In these forty days,
strip from me what does not belong to you:
the excess, the noise, the small idols I have built.

Teach me to fast not from food alone,
but from judgment, from envy, from despair.

Open my hands so that what I save
may become bread for someone in need.

Through Christ, who fasted for us in the desert.

**Amen.**`,
        group: "liturgical",
        categoryId: cat("lent"),
        author: null,
        readingMinutes: 3,
      },
      {
        slug: "regina-caeli",
        title: "Regina Caeli",
        summary: "The Easter season antiphon to the Queen of Heaven.",
        body: `Queen of Heaven, rejoice, **alleluia.**
For He whom you did merit to bear, **alleluia,**
Has risen, as He said, **alleluia.**
Pray for us to God, **alleluia.**

Rejoice and be glad, O Virgin Mary, **alleluia.**
For the Lord has truly risen, **alleluia.**

*Let us pray.*
O God, who through the resurrection of your Son, our Lord Jesus Christ,
gave joy to the world: grant, we beseech you, that through his Mother,
the Virgin Mary, we may obtain the joys of everlasting life.
Through the same Christ our Lord.

**Amen.**`,
        group: "liturgical",
        categoryId: cat("easter"),
        author: "Sacred Tradition",
        readingMinutes: 2,
      },
      {
        slug: "te-deum",
        title: "Te Deum (We Praise You, O God)",
        summary: "An ancient hymn of thanksgiving for great occasions.",
        body: `We praise you, O God,
we acclaim you as Lord;
all creation worships you,
the Father everlasting.

To you all angels, all the powers of heaven,
the cherubim and seraphim, sing in endless praise:
*Holy, holy, holy Lord, God of power and might,*
*heaven and earth are full of your glory.*

The glorious company of apostles praise you.
The noble fellowship of prophets praise you.
The white-robed army of martyrs praise you.

Throughout the world the holy Church acclaims you:
Father, of majesty unbounded;
your true and only Son, worthy of all worship;
and the Holy Spirit, advocate and guide.

**Amen.**`,
        group: "daily",
        categoryId: cat("gratitude"),
        author: "Sacred Tradition",
        readingMinutes: 3,
      },
      {
        slug: "anima-christi",
        title: "Anima Christi",
        summary: "Soul of Christ — a prayer of intimacy after Communion.",
        body: `Soul of Christ, sanctify me.
Body of Christ, save me.
Blood of Christ, inebriate me.
Water from the side of Christ, wash me.
Passion of Christ, strengthen me.

O good Jesus, hear me.
Within thy wounds hide me.
Permit me not to be separated from thee.
From the wicked foe, defend me.

In the hour of my death, call me,
and bid me come to thee,
that with thy saints I may praise thee
forever and ever.

**Amen.**`,
        group: "daily",
        categoryId: cat("morning-evening"),
        author: "Sacred Tradition",
        readingMinutes: 2,
      },
    ])
    .onConflictDoNothing();

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .slice(0, 10);

  await db
    .insert(liturgicalDaysTable)
    .values([
      {
        date: today,
        season: "easter",
        color: "white",
        isFeast: false,
        title: "Friday of the Third Week of Easter",
        saint: "St. Mark the Evangelist",
        reflection:
          "The Risen Lord meets the disciples on the road. Listen for the warmth that rises in your own heart when his words break open.",
        recommendedPrayerSlug: "regina-caeli",
      },
      {
        date: tomorrow,
        season: "easter",
        color: "white",
        isFeast: false,
        title: "Saturday of the Third Week of Easter",
        saint: null,
        reflection:
          "Pause for one quiet alleluia today, simply because Christ is risen.",
        recommendedPrayerSlug: "te-deum",
      },
      {
        date: dayAfter,
        season: "easter",
        color: "white",
        isFeast: false,
        title: "Fourth Sunday of Easter — Good Shepherd",
        saint: null,
        reflection:
          "The Shepherd knows your name. Tell him today the part of your life that needs his lead.",
        recommendedPrayerSlug: "anima-christi",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(wallPostsTable)
    .values([
      {
        userId: null,
        displayName: "Anonymous",
        anonymous: true,
        message:
          "Please pray for my mother, who begins chemotherapy this week. Asking for peace for our whole family.",
        category: "healing",
        prayCount: 12,
        status: "approved",
      },
      {
        userId: null,
        displayName: "Maria",
        anonymous: false,
        message:
          "Thank you, Lord, for a safe arrival home after a long journey. Praise to God for every traveler still on the road tonight.",
        category: "gratitude",
        prayCount: 7,
        status: "approved",
      },
      {
        userId: null,
        displayName: "Anonymous",
        anonymous: true,
        message:
          "Discerning a vocation. Please pray that I will hear God's call clearly and have the courage to answer.",
        category: "vocation",
        prayCount: 4,
        status: "approved",
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
